"""Transactional email via the Resend HTTP API (stdlib only, no SDK dependency).

Mirrors the GEMINI_API_KEY pattern in core/config.py: with no API key set,
sends are skipped and the content is logged instead, so local dev never
needs a real Resend account.
"""
import json
import logging
import urllib.request
from urllib.error import HTTPError, URLError
from core.config import settings

_log = logging.getLogger("uvicorn.error")

RESEND_URL = "https://api.resend.com/emails"


def _verification_email_html(full_name: str, code: str) -> str:
    return f"""\
<div style="background:#0d0d10;padding:40px 20px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:440px;margin:0 auto;background:#17171c;border:1px solid #2a2a32;border-radius:16px;padding:36px 32px;">
    <p style="margin:0 0 4px;color:#8a8a94;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Synapse LE</p>
    <h1 style="margin:0 0 16px;color:#f5f5f7;font-size:20px;font-weight:700;">Thank you {full_name}, for signing up</h1>
    <p style="margin:0 0 20px;color:#c2c2c9;font-size:14px;line-height:1.6;">
      Sapam welcomes you to VeriSphere's early beta access.
    </p>
    <p style="margin:0 0 24px;color:#c2c2c9;font-size:14px;line-height:1.6;">
      Enter this code in the sign-up form to claim your account. It expires once used or replaced by a new request.
    </p>
    <div style="background:#0d0d10;border:1px solid #2a2a32;border-radius:12px;padding:18px;text-align:center;margin-bottom:24px;">
      <span style="color:#f5f5f7;font-size:28px;font-weight:700;letter-spacing:0.35em;">{code}</span>
    </div>
    <p style="margin:0 0 12px;color:#c2c2c9;font-size:13px;line-height:1.6;">
      Feel free to reach out anytime at <a href="mailto:vsapofficial@gmail.com" style="color:#8fb3ff;">vsapofficial@gmail.com</a> for any issue you encounter.
    </p>
    <p style="margin:0;color:#6f6f78;font-size:12px;line-height:1.6;">
      Didn't request this? You can safely ignore this email.<br>
      &mdash; The Synapse LE Team
    </p>
  </div>
</div>"""


def _password_reset_email_html(full_name: str, code: str) -> str:
    return f"""\
<div style="background:#0d0d10;padding:40px 20px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:440px;margin:0 auto;background:#17171c;border:1px solid #2a2a32;border-radius:16px;padding:36px 32px;">
    <p style="margin:0 0 4px;color:#8a8a94;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Synapse LE</p>
    <h1 style="margin:0 0 16px;color:#f5f5f7;font-size:20px;font-weight:700;">Reset your password, {full_name}</h1>
    <p style="margin:0 0 24px;color:#c2c2c9;font-size:14px;line-height:1.6;">
      Enter this code in the reset password form to choose a new password. It expires in 30 minutes or once used.
    </p>
    <div style="background:#0d0d10;border:1px solid #2a2a32;border-radius:12px;padding:18px;text-align:center;margin-bottom:24px;">
      <span style="color:#f5f5f7;font-size:28px;font-weight:700;letter-spacing:0.35em;">{code}</span>
    </div>
    <p style="margin:0 0 12px;color:#c2c2c9;font-size:13px;line-height:1.6;">
      Feel free to reach out anytime at <a href="mailto:vsapofficial@gmail.com" style="color:#8fb3ff;">vsapofficial@gmail.com</a> for any issue you encounter.
    </p>
    <p style="margin:0;color:#6f6f78;font-size:12px;line-height:1.6;">
      Didn't request this? You can safely ignore this email &mdash; your password stays unchanged.<br>
      &mdash; The Synapse LE Team
    </p>
  </div>
</div>"""


def _send_email(to_email: str, subject: str, html: str, log_label: str, code: str) -> None:
    if not settings.RESEND_API_KEY:
        _log.info("[DEV] %s for %s: %s (RESEND_API_KEY unset, email not sent)", log_label, to_email, code)
        return

    payload = json.dumps({
        "from": settings.VERIFICATION_EMAIL_FROM,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }).encode()

    request = urllib.request.Request(
        RESEND_URL,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
            # Resend sits behind Cloudflare, which blocks urllib's default
            # "Python-urllib/x.y" User-Agent as a bot signature.
            "User-Agent": "verisphere-backend/1.0",
        },
    )
    try:
        urllib.request.urlopen(request, timeout=10)
    except (HTTPError, URLError) as exc:
        _log.error("Failed to send %s to %s: %s", log_label, to_email, exc)


def send_verification_email(to_email: str, full_name: str, code: str) -> None:
    _send_email(
        to_email, "Your VeriSphere beta access",
        _verification_email_html(full_name, code), "Verification code", code,
    )


def send_password_reset_email(to_email: str, full_name: str, code: str) -> None:
    _send_email(
        to_email, "Reset your VeriSphere password",
        _password_reset_email_html(full_name, code), "Password reset code", code,
    )
