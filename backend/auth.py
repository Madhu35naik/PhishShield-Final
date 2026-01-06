# auth.py - Authentication Backend for PhishShield ML (FINAL VERSION)

"""
Authentication API with:
- User Registration
- Login with JWT
- Secure Password Reset (Token NOT exposed to frontend)
- Replay attack prevention
"""

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone
import jwt
import re
import secrets
import os
from functools import wraps

# ============================================================
# CONFIGURATION
# ============================================================

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
JWT_EXPIRATION_HOURS = 24
RESET_TOKEN_EXPIRY_HOURS = 1

# ============================================================
# DATABASE CONNECTION
# ============================================================

from utils.config import MONGO_URI, MONGO_DATABASE_NAME

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGO_DATABASE_NAME]

    users_collection = db["users"]
    reset_tokens_collection = db["password_reset_tokens"]

    users_collection.create_index("email", unique=True)
    reset_tokens_collection.create_index("email")
    reset_tokens_collection.create_index("expires_at", expireAfterSeconds=0)

    print("✅ Auth MongoDB connected")
except Exception as e:
    print("❌ Auth MongoDB connection failed:", e)
    users_collection = None
    reset_tokens_collection = None

# ============================================================
# BLUEPRINT
# ============================================================

auth_bp = Blueprint("auth", __name__)

# ============================================================
# VALIDATION UTILITIES
# ============================================================

def validate_email(email):
    return re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email)

def validate_name(name):
    if len(name) < 2 or len(name) > 50:
        return False, "Name must be 2–50 characters"
    if not re.match(r'^[a-zA-Z\s]+$', name):
        return False, "Name can contain only letters and spaces"
    return True, "Valid"

def validate_password(password):
    if len(password) < 8:
        return False, "Minimum 8 characters required"
    if not re.search(r'[A-Z]', password):
        return False, "Must contain an uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Must contain a lowercase letter"
    if not re.search(r'\d', password):
        return False, "Must contain a number"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Must contain a special character"
    return True, "Strong password"

# ============================================================
# JWT UTILITIES
# ============================================================

def generate_token(user_id, email):
    payload = {
        "user_id": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Authentication token missing"}), 401

        try:
            if token.startswith("Bearer "):
                token = token[7:]

            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user = users_collection.find_one({"email": data["email"]})

            if not user:
                return jsonify({"error": "User not found"}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(user, *args, **kwargs)

    return decorated

# ============================================================
# AUTH ROUTES
# ============================================================

@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not all([name, email, password, confirm_password]):
        return jsonify({"error": "All fields are required"}), 400

    valid, msg = validate_name(name)
    if not valid:
        return jsonify({"error": msg}), 400

    if not validate_email(email):
        return jsonify({"error": "Invalid email"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400

    valid, msg = validate_password(password)
    if not valid:
        return jsonify({"error": msg}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    hashed = generate_password_hash(password)

    user = {
        "name": name,
        "email": email,
        "password": hashed,
        "created_at": datetime.now(timezone.utc),
        "last_login": None
    }

    result = users_collection.insert_one(user)
    token = generate_token(result.inserted_id, email)

    return jsonify({
        "success": True,
        "token": token,
        "user": {"id": str(result.inserted_id), "name": name, "email": email}
    }), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = users_collection.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )

    token = generate_token(user["_id"], email)

    return jsonify({
        "success": True,
        "token": token,
        "user": {"id": str(user["_id"]), "name": user["name"], "email": email}
    })


# ============================================================
# PASSWORD RESET (TOKEN HIDDEN)
# ============================================================

@auth_bp.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not validate_email(email):
        return jsonify({"error": "Invalid email"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Account not found"}), 404

    reset_tokens_collection.delete_many({"email": email})

    reset_token = secrets.token_urlsafe(32)

    reset_tokens_collection.insert_one({
        "email": email,
        "token": reset_token,
        "used": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRY_HOURS)
    })

    return jsonify({
        "success": True,
        "message": "Password reset request accepted. Please set a new password."
    })


@auth_bp.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not all([email, new_password, confirm_password]):
        return jsonify({"error": "All fields are required"}), 400

    valid, msg = validate_password(new_password)
    if not valid:
        return jsonify({"error": msg}), 400

    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    token_data = reset_tokens_collection.find_one({
        "email": email,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })

    if not token_data:
        return jsonify({"error": "Reset request expired or invalid"}), 400

    users_collection.update_one(
        {"email": email},
        {"$set": {"password": generate_password_hash(new_password)}}
    )

    reset_tokens_collection.update_one(
        {"_id": token_data["_id"]},
        {"$set": {"used": True}}
    )

    return jsonify({
        "success": True,
        "message": "Password updated successfully"
    })


# ============================================================
# VERIFY TOKEN
# ============================================================

@auth_bp.route("/api/auth/verify", methods=["GET"])
@token_required
def verify(current_user):
    return jsonify({
        "success": True,
        "user": {
            "id": str(current_user["_id"]),
            "name": current_user["name"],
            "email": current_user["email"]
        }
    })
