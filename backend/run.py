"""
Uvicorn entry point — run with:
    python run.py
or directly:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
from dotenv import load_dotenv
import os
load_dotenv()
print("GEMINI KEY:", os.getenv("GEMINI_API_KEY", "NOT FOUND")[:12])

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
