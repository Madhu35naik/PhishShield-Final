# app.py - CLEANED FINAL VERSION (ML ONLY, NO URL EXPANSION, NO RULE FALLBACK)

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from datetime import datetime
import traceback
import re
from urllib.parse import urlparse

from auth import auth_bp, token_required
from utils.Logger import log_scan_result, get_scan_reports
from FeatureExtraction import featureExtraction, feature_names
from AttackClassification import (
    analyze_phishing_attack,
    calculate_risk_score,
    generate_educational_content
)

# ============================================================
# URL VALIDATION
# ============================================================

def validate_url(url):
    if not url or not isinstance(url, str):
        return False, "URL cannot be empty"

    url = url.strip()

    if url.isdigit():
        return False, "URL cannot be numeric only"

    if len(url) < 3:
        return False, "URL is too short"

    if " " in url:
        return False, "URL contains spaces"

    if not url.startswith(("http://", "https://", "ftp://")):
        url = "http://" + url

    pattern = re.compile(
        r"^https?://"
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
        r"localhost|"
        r"\d{1,3}(\.\d{1,3}){3})"
        r"(?::\d+)?"
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE,
    )

    try:
        parsed = urlparse(url)
        if not parsed.netloc or not pattern.match(url):
            return False, "Invalid URL format"
        return True, url
    except Exception:
        return False, "URL parsing failed"


def get_url_validation_guidance():
    return {
        "valid_examples": [
            "https://www.example.com",
            "http://example.com/login",
            "https://sub.domain.org",
            "http://192.168.1.1",
        ],
        "invalid_examples": [
            "example",
            "just text",
            "example .com",
            "12345",
        ],
        "tips": [
            "URL must start with http:// or https://",
            "Domain name must be valid",
            "Spaces are not allowed",
        ],
    }

# ============================================================
# APP SETUP
# ============================================================

app = Flask(__name__)
CORS(app)
app.register_blueprint(auth_bp)

MAX_BATCH_SIZE = 50
MODEL_PATH = "phishing_model.pkl"

# ============================================================
# LOAD ML MODEL (MANDATORY)
# ============================================================

try:
    model_data = joblib.load(MODEL_PATH)
    if isinstance(model_data, dict) and "model" in model_data:
        model = model_data["model"]
        model_name = model_data.get("model_name", type(model).__name__)
    else:
        model = model_data
        model_name = type(model).__name__

    print(f"✅ ML Model loaded successfully: {model_name}")

except Exception as e:
    print("❌ ML model loading failed:", e)
    model = None
    model_name = None

# ============================================================
# ROOT & HEALTH
# ============================================================

@app.route("/")
def home():
    return jsonify({
        "service": "PhishShield API",
        "version": "4.0 (ML Only)"
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "OK",
        "model_loaded": model is not None,
        "model_name": model_name,
        "authentication": "JWT"
    })

# ============================================================
# URL VALIDATION API
# ============================================================

@app.route("/api/validate-url", methods=["POST"])
def validate_url_api():
    data = request.get_json(force=True)
    url = data.get("url", "")
    is_valid, result = validate_url(url)

    if is_valid:
        return jsonify({"valid": True, "formatted_url": result})

    return jsonify({
        "valid": False,
        "error": result,
        "guidance": get_url_validation_guidance()
    }), 400

# ============================================================
# SINGLE SCAN API (ML ONLY)
# ============================================================

@app.route("/api/scan", methods=["POST"])
@token_required
def scan_url(current_user):
    if model is None:
        return jsonify({"error": "ML model not available"}), 500

    try:
        data = request.get_json(force=True)
        url = data.get("url")

        is_valid, clean_url = validate_url(url)
        if not is_valid:
            return jsonify({
                "error": clean_url,
                "guidance": get_url_validation_guidance()
                }), 400

        features = featureExtraction(clean_url, None)
        features_np = np.array(features).reshape(1, -1)

        pred = int(model.predict(features_np)[0])
        confidence = float(
            model.predict_proba(features_np)[0][pred] * 100
        )

        result = analyze_phishing_attack(features, pred, confidence)

        response = {
            "url": clean_url,
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "risk_score": calculate_risk_score(features, result["attack_types"]),
            "attack_types": result["attack_types"],
            "prevention": result["prevention"],
            "educational_content": generate_educational_content(
                result["attack_types"], features
            ),
            "features": dict(zip(feature_names, features)),
            "timestamp": datetime.utcnow().isoformat(),
        }

        log_scan_result(response, is_batch=False, user_id=str(current_user["_id"]))
        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ============================================================
# BATCH SCAN API (ML ONLY) - FIXED VERSION
# ============================================================

@app.route("/api/batch", methods=["POST"])
@token_required
def batch_scan(current_user):
    if model is None:
        return jsonify({"error": "ML model not available"}), 500

    data = request.get_json(force=True)
    urls = data.get("urls", [])

    if not isinstance(urls, list) or not urls:
        return jsonify({"error": "Provide a list of URLs"}), 400

    results = []
    validation_errors = [] # Captures URLs for the frontend warning panel

    for idx, url in enumerate(urls[:MAX_BATCH_SIZE]):
        is_valid, clean_url = validate_url(url)
        if not is_valid:
            # Added for yellow validation box in UI
            validation_errors.append({
                "index": idx,
                "url": url,
                "error": clean_url
            })
            results.append({
                "url": url,
                "prediction": "error",
                "attack_types": ["INVALID_URL"],
                "risk_score": None  # Changed to None for N/A display in UI
            })
            continue

        try:
            feats = featureExtraction(clean_url, None)
            feats_np = np.array(feats).reshape(1, -1)

            p = int(model.predict(feats_np)[0])
            c = float(model.predict_proba(feats_np)[0][p] * 100)

            res = analyze_phishing_attack(feats, p, c)
            score = calculate_risk_score(feats, res["attack_types"])

            results.append({
                "url": clean_url,
                "prediction": res["prediction"],
                "confidence": res["confidence"],
                "risk_score": score,
                "attack_types": res["attack_types"]
            })

        except Exception:
            results.append({
                "url": clean_url,
                "prediction": "error",
                "attack_types": ["PROCESSING_ERROR"],
                "risk_score": None # Fallback for processing failures
            })

    # Summary updated with high_risk_count and invalid_url_count
    summary = {
        "total": len(results),
        "invalid_url_count": len(validation_errors),
        "phishing_count": sum(1 for r in results if r.get("prediction") == "phishing"),
        "legitimate_count": sum(1 for r in results if r.get("prediction") == "legitimate"),
        "high_risk_count": sum(1 for r in results if r.get("risk_score") is not None and r.get("risk_score") >= 51)
    }

    log_scan_result(
        {"results": results, "summary": summary, "total": len(results)},
        is_batch=True,
        user_id=str(current_user["_id"])
    )

    return jsonify({
        "summary": summary,
        "results": results,
        "validation_errors": validation_errors, # Fixes yellow panel display
        "total": len(results) # Fixes "Total Processed" box
    })

# ============================================================
# LOGS API
# ============================================================

@app.route("/api/logs", methods=["GET"])
@token_required
def get_logs(current_user):
    limit = int(request.args.get("limit", 50))
    start_date = request.args.get("start_date")  # ✅ REQUIRED

    return jsonify(
        get_scan_reports(
            user_id=str(current_user["_id"]),
            limit=limit,
            start_date=start_date  # ✅ REQUIRED
        )
    )


# ============================================================
# STATS API
# ============================================================

@app.route("/api/stats", methods=["GET"])
def stats():
    return jsonify({
        "model": {
            "name": model_name,
            "loaded": model is not None,
            "feature_count": len(feature_names)
        },
        "risk_levels": {
            "low": "0-25",
            "medium": "26-50",
            "high": "51-75",
            "critical": "76-100"
        }
    })

# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, use_reloader=False)