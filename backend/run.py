"""
Uvicorn entry point — run with:
    python run.py
or directly:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
import os
import sys

# Ensure backend directory is the working context for .env loading
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
