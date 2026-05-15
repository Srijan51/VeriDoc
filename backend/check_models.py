"""
Run this from your backend folder:
    python check_models.py

It will print every model your API key can access,
and specifically test which embedding models work.
"""

import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Key starts with: {api_key[:8] if api_key else 'NOT FOUND'}...")
print(f"Key length: {len(api_key) if api_key else 0}")
print()

from google import genai
from google.genai import types

# Try v1beta first (default)
print("=== Models available on v1beta ===")
try:
    client_beta = genai.Client(api_key=api_key)
    for m in client_beta.models.list():
        if "embed" in m.name.lower():
            print(" ", m.name)
except Exception as e:
    print("  ERROR:", e)

print()

# Try v1
print("=== Models available on v1 ===")
try:
    client_v1 = genai.Client(api_key=api_key, http_options=types.HttpOptions(api_version="v1"))
    for m in client_v1.models.list():
        if "embed" in m.name.lower():
            print(" ", m.name)
except Exception as e:
    print("  ERROR:", e)

print()

# Try actually calling each known embedding model
print("=== Testing embedding models directly ===")
test_models = [
    "text-embedding-004",
    "models/text-embedding-004",
    "embedding-001",
    "models/embedding-001",
    "text-embedding-preview-0409",
]

client = genai.Client(api_key=api_key)
for model in test_models:
    try:
        result = client.models.embed_content(
            model=model,
            contents="test sentence",
        )
        print(f"  ✓ {model} — dim={len(result.embeddings[0].values)}")
    except Exception as e:
        print(f"  ✗ {model} — {str(e)[:80]}")