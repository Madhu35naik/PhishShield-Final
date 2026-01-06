# utils/Logger.py (FIXED FOR IST DATE FILTERING)

from pymongo import MongoClient
from datetime import datetime, timezone, timedelta 
import traceback
from .config import MONGO_URI, MONGO_DATABASE_NAME, MONGO_COLLECTION_NAME, LOG_RETENTION_DAYS

# Initialize MongoDB client and collection
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGO_DATABASE_NAME]
    log_collection = db[MONGO_COLLECTION_NAME]

    # Auto-delete logs after retention period
    log_collection.create_index(
        "timestamp",
        expireAfterSeconds=LOG_RETENTION_DAYS * 24 * 3600
    )

    print(f"✅ MongoDB connected to DB: {MONGO_DATABASE_NAME}")

except Exception as e:
    print(f"⚠️ MongoDB connection failed: {e}")
    client = None
    log_collection = None


# ============================================================
# LOG INDIVIDUAL OR BATCH SCAN RESULT
# ============================================================
def log_scan_result(log_data: dict, is_batch: bool = False, user_id: str = None):
    """
    Logs a single scan result or batch summary to MongoDB with user isolation.
    """
    if log_collection is None:
        return {"success": False, "message": "Database not connected."}

    # Ensure metadata is added with standard UTC
    log_data["timestamp"] = datetime.now(timezone.utc)
    log_data["is_batch"] = is_batch

    try:
        if is_batch:
            log_entry = {
                "user_id": user_id,
                "url_count": log_data.get("total", 0),
                "summary": log_data.get("summary", {}),
                "results_preview": log_data.get("results", []),
                "timestamp": log_data["timestamp"],
                "is_batch": True
            }
        else:
            confidence_value = log_data.get("confidence")
            log_entry = {
                "user_id": user_id,
                "url": log_data.get("url"),
                "prediction": log_data.get("prediction"),
                "confidence": float(confidence_value) if confidence_value is not None else 0.0,
                "risk_score": log_data.get("risk_score"),
                "attack_types": log_data.get("attack_types", []),
                "timestamp": log_data["timestamp"],
                "is_batch": False
            }

        result = log_collection.insert_one(log_entry)
        return {"success": True, "log_id": str(result.inserted_id)}

    except Exception as e:
        print(f"Error logging scan result: {e}")
        traceback.print_exc()
        return {"success": False, "message": str(e)}


# ============================================================
# RETRIEVE SAVED LOGS - FIXED DATE FILTERING FOR IST
# ============================================================
def get_scan_reports(user_id: str, limit: int = 50, start_date: str = None):
    """
    Retrieves recent scan logs filtered by the requesting user's ID and date.
    """
    if log_collection is None:
        return {"error": "Database not connected."}, 500

    query = {"user_id": user_id}

    if start_date:
        try:
            # Parse the YYYY-MM-DD string from the frontend
            dt_start_naive = datetime.strptime(start_date, "%Y-%m-%d")
            
            # IST is 5:30 hours ahead of UTC.
            # To catch all scans starting from midnight IST, we set UTC midnight 
            # and subtract 6 hours (safety margin) to cover the timezone gap.
            # This ensures early morning IST scans aren't excluded.
            dt_start_utc = dt_start_naive.replace(
                hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
            ) - timedelta(hours=6)
            
            query["timestamp"] = {"$gte": dt_start_utc}
        except ValueError:
            return {"error": f"Invalid date format: {start_date}. Expected YYYY-MM-DD."}, 400
        except Exception as e:
            return {"error": f"Date filtering error: {e}"}, 500

    try:
        logs_cursor = (
            log_collection.find(query)
            .sort("timestamp", -1)
            .limit(limit)
        )

        reports = []
        for log in logs_cursor:
            log["_id"] = str(log["_id"])

            # Standardize timestamp for frontend ISO compatibility
            if isinstance(log["timestamp"], datetime):
                # Ensure it is UTC aware then format for JavaScript Date constructor
                if log["timestamp"].tzinfo is None:
                    log["timestamp"] = log["timestamp"].replace(tzinfo=timezone.utc)
                log["timestamp"] = log["timestamp"].isoformat()

            # Ensure error_count is present for UI display compatibility
            if log.get("is_batch") and "summary" in log:
                # Sync naming so ReportsLogger.js finds the count
                log["summary"]["error_count"] = log["summary"].get("invalid_url_count", 0)

            # Guarantee presence of confidence field
            if not log.get("is_batch", False) and "confidence" not in log:
                log["confidence"] = 0.0

            reports.append(log)

        return {"total_logs": len(reports), "reports": reports}

    except Exception as e:
        traceback.print_exc()
        return {"error": f"Database error: {e}"}, 500