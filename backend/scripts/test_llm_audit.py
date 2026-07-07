"""Quick smoke test for the Gemini audit integration - no FastAPI/auth
required. Run from the backend/ folder: python scripts/test_llm_audit.py

Confirms GEMINI_API_KEY is set and Gemini responds with the expected JSON
shape, using a small made-up post + source instead of a real database row.
"""
import os
import sys

# Running this as `python scripts/test_llm_audit.py` only puts scripts/ on
# sys.path, not backend/ itself - add it explicitly so `services` resolves.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.llm_audit import analyze_audit_collection, LlmAuditError

sample_data = {
    "blog": {"id": 1, "strTitle": "Test post", "strContent": "This is a test post used only to verify the Gemini audit integration."},
    "contexts": [],
    "sources": [
        {"id": 1, "context_id": 1, "strTitle": "Example source", "strUrl": "https://example.com", "strAuthor": "tester"},
    ],
    "comments": [],
}

if __name__ == "__main__":
    try:
        result = analyze_audit_collection(sample_data)
        print("Gemini call succeeded. Parsed response:")
        print(result)
    except LlmAuditError as e:
        print(f"Gemini call failed: {e}")
