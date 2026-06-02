# utils/config.py

from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# MongoDB settings
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DATABASE_NAME = "PhishingDB"
MONGO_COLLECTION_NAME = "scan_logs" 

# Log retention policy (e.g., in days)
LOG_RETENTION_DAYS = 30