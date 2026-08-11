import json
import logging
import urllib.request
from urllib.error import HTTPError, URLError

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

_log = logging.getLogger("django")

RESEND_URL = "https://api.resend.com/emails"


class ResendEmailBackend(BaseEmailBackend):
    """Routes Django's mail framework through Resend, so Djoser's stock
    activation/password-reset emails send via the same provider as the
    rest of the app instead of requiring a second email integration.
    """

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not settings.RESEND_API_KEY:
            for message in email_messages:
                _log.info(
                    "[DEV] Email to %s: %s (RESEND_API_KEY unset, not sent)",
                    message.to, message.subject,
                )
            return len(email_messages)

        sent = 0
        for message in email_messages:
            if self._send_one(message):
                sent += 1
        return sent

    def _html_body(self, message):
        if getattr(message, "content_subtype", "plain") == "html":
            return message.body
        for content, mimetype in getattr(message, "alternatives", []):
            if mimetype == "text/html":
                return content
        return f"<pre>{message.body}</pre>"

    def _send_one(self, message):
        payload = json.dumps({
            "from": message.from_email or settings.VERIFICATION_EMAIL_FROM,
            "to": list(message.to),
            "subject": message.subject,
            "html": self._html_body(message),
        }).encode()

        request = urllib.request.Request(
            RESEND_URL, data=payload, method="POST",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "verisphere-backend/1.0",
            },
        )
        try:
            urllib.request.urlopen(request, timeout=10)
            return True
        except (HTTPError, URLError, OSError, TimeoutError) as exc:
            # Djoser calls .send() without fail_silently=True, but an email hiccup
            # must never fail the account-creation/reset request that triggered it.
            _log.error("Failed to send email to %s: %s", message.to, exc)
            return False
