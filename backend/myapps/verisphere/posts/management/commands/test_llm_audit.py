from django.core.management.base import BaseCommand

from llm_services.llm_audit import LlmAuditError, analyze_audit_collection

SAMPLE_DATA = {
    "blog": {"id": 1, "strTitle": "Test post", "strContent": "This is a test post used only to verify the Gemini audit integration."},
    "contexts": [],
    "sources": [
        {"id": 1, "context_id": 1, "strTitle": "Example source", "strUrl": "https://example.com", "strAuthor": "tester"},
    ],
    "comments": [],
}


class Command(BaseCommand):
    help = "Smoke-test the Gemini audit integration with a made-up post."

    def handle(self, *args, **options):
        try:
            result = analyze_audit_collection(SAMPLE_DATA)
            self.stdout.write(self.style.SUCCESS("Gemini call succeeded. Parsed response:"))
            self.stdout.write(str(result))
        except LlmAuditError as e:
            self.stdout.write(self.style.ERROR(f"Gemini call failed: {e}"))
