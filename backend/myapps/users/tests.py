import datetime

import bcrypt
import jwt
from django.conf import settings
from django.utils import timezone
from rest_framework.test import APITestCase

from myapps.users.authentication import create_access_token
from myapps.users.models import AnalysisUsageModel, PendingUserModel, UserModel
from myapps.users.passwords import hash_password, needs_rehash, verify_password


def _make_user(username, **kwargs):
    defaults = {
        "email": f"{username}@example.com", "first_name": "T", "last_name": "U",
        "is_active": True, "password": hash_password("pass12345"),
    }
    defaults.update(kwargs)
    return UserModel.objects.create(username=username, **defaults)


class PasswordCompatTests(APITestCase):

    def test_fresh_hash_round_trip(self):
        h = hash_password("CorrectHorseBatteryStaple1")
        self.assertTrue(h.startswith("pbkdf2_sha256$"))
        self.assertTrue(verify_password("CorrectHorseBatteryStaple1", h))
        self.assertFalse(verify_password("wrong", h))
        self.assertFalse(needs_rehash(h))

    def test_legacy_bcrypt_hash_verifies(self):
        legacy = bcrypt.hashpw(b"LegacyPass123", bcrypt.gensalt(rounds=4)).decode()
        self.assertTrue(verify_password("LegacyPass123", legacy))
        self.assertFalse(verify_password("wrong", legacy))
        self.assertTrue(needs_rehash(legacy))

    def test_plaintext_fallback(self):
        self.assertTrue(verify_password("rawvalue", "rawvalue"))
        self.assertFalse(verify_password("wrong", "rawvalue"))

    def test_empty_hash_never_verifies(self):
        self.assertFalse(verify_password("anything", ""))
        self.assertFalse(verify_password("anything", None))


class AuthFlowTests(APITestCase):
    def test_register_verify_login_me(self):
        response = self.client.post("/api/auth/register", {
            "username": "testuser1", "email": "testuser1@example.com",
            "first_name": "Test", "last_name": "User", "password": "TestPass1234",
        }, format="json")
        self.assertEqual(response.status_code, 200)

        pending = PendingUserModel.objects.get(username="testuser1")
        response = self.client.post("/api/auth/verify-email", {
            "username": "testuser1", "code": pending.strVerificationCode,
        }, format="json")
        self.assertEqual(response.status_code, 200)
        token = response.json()["access_token"]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        self.assertEqual(set(payload.keys()), {"sub", "exp"})
        self.assertEqual(payload["sub"], "testuser1")

        self.assertFalse(PendingUserModel.objects.filter(username="testuser1").exists())

        response = self.client.get("/api/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "testuser1")

        response = self.client.post(
            "/api/auth/token", "username=testuser1&password=TestPass1234",
            content_type="application/x-www-form-urlencoded",
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Not authenticated")

        response = self.client.get("/api/auth/me", HTTP_AUTHORIZATION="Bearer garbage.token.here")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Could not validate credentials")

    def test_login_wrong_password(self):
        _make_user("testuser2", password=hash_password("RealPass123"))
        response = self.client.post(
            "/api/auth/token", "username=testuser2&password=WrongPass",
            content_type="application/x-www-form-urlencoded",
        )
        self.assertEqual(response.status_code, 401)

    def test_login_missing_fields_422(self):
        response = self.client.post("/api/auth/token", content_type="application/x-www-form-urlencoded")
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "Field required")

        response = self.client.post(
            "/api/auth/token", "password=x", content_type="application/x-www-form-urlencoded",
        )
        self.assertEqual(response.status_code, 422)

    def test_login_rehashes_legacy_password_transparently(self):
        legacy = bcrypt.hashpw(b"LegacyPass123", bcrypt.gensalt(rounds=4)).decode()
        user = _make_user("legacyuser", password=legacy)
        response = self.client.post(
            "/api/auth/token", "username=legacyuser&password=LegacyPass123",
            content_type="application/x-www-form-urlencoded",
        )
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.password.startswith("pbkdf2_sha256$"))

    def test_inactive_user_cannot_login(self):
        _make_user("inactiveuser", is_active=False, password=hash_password("RealPass123"))
        response = self.client.post(
            "/api/auth/token", "username=inactiveuser&password=RealPass123",
            content_type="application/x-www-form-urlencoded",
        )
        self.assertEqual(response.status_code, 403)

    def test_inactive_user_gets_400_not_401(self):
        user = _make_user("testuser3", is_active=False)
        token = create_access_token(user.username)
        response = self.client.get("/api/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Inactive user")


class RegistrationValidationTests(APITestCase):
    def _register(self, **overrides):
        data = {
            "username": "validuser", "email": "validuser@example.com",
            "first_name": "V", "last_name": "U", "password": "ValidPass123",
        }
        data.update(overrides)
        return self.client.post("/api/auth/register", data, format="json")

    def test_username_too_short(self):
        response = self._register(username="ab")
        self.assertEqual(response.status_code, 422)
        self.assertIn("at least 3 characters", response.json()["detail"])

    def test_username_invalid_characters(self):
        response = self._register(username="bad username!")
        self.assertEqual(response.status_code, 422)

    def test_password_too_short(self):
        response = self._register(password="short")
        self.assertEqual(response.status_code, 422)
        self.assertIn("at least 8 characters", response.json()["detail"])

    def test_blank_first_name_rejected(self):
        response = self._register(first_name="   ")
        self.assertEqual(response.status_code, 422)

    def test_invalid_email_rejected(self):
        response = self._register(email="not-an-email")
        self.assertEqual(response.status_code, 422)

    def test_duplicate_real_username_rejected(self):
        _make_user("validuser")
        response = self._register()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Username already registered")

    def test_duplicate_real_email_rejected(self):
        _make_user("someoneelse", email="validuser@example.com")
        response = self._register()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Email already registered")

    def test_reregistering_unverified_username_overwrites_pending_row(self):
        r1 = self._register()
        self.assertEqual(r1.status_code, 200)
        first_code = PendingUserModel.objects.get(username="validuser").strVerificationCode

        r2 = self._register(email="validuser2@example.com")
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(PendingUserModel.objects.filter(username="validuser").count(), 1)
        second_code = PendingUserModel.objects.get(username="validuser").strVerificationCode




class VerifyEmailAttemptLimitTests(APITestCase):
    def setUp(self):
        self.pending = PendingUserModel.objects.create(
            username="attemptuser", email="attemptuser@example.com", password=hash_password("x"),
            first_name="A", last_name="U", strVerificationCode="123456",
        )

    def test_wrong_code_increments_attempts(self):
        response = self.client.post(
            "/api/auth/verify-email", {"username": "attemptuser", "code": "000000"}, format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.pending.refresh_from_db()
        self.assertEqual(self.pending.verification_attempts, 1)

    def test_exceeding_max_attempts_returns_429(self):
        self.pending.verification_attempts = 5
        self.pending.save()
        response = self.client.post(
            "/api/auth/verify-email", {"username": "attemptuser", "code": "123456"}, format="json",
        )
        self.assertEqual(response.status_code, 429)

    def test_resend_resets_attempts(self):
        self.pending.verification_attempts = 4
        self.pending.save()
        response = self.client.post("/api/auth/resend-verification", {"username": "attemptuser"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.pending.refresh_from_db()
        self.assertEqual(self.pending.verification_attempts, 0)
        self.assertNotEqual(self.pending.strVerificationCode, "123456")

    def test_resend_for_unknown_username_404(self):
        response = self.client.post("/api/auth/resend-verification", {"username": "nobody"}, format="json")
        self.assertEqual(response.status_code, 404)


class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = _make_user("resetuser")

    def test_forgot_password_unknown_user_gives_generic_message(self):
        r1 = self.client.post("/api/auth/forgot-password", {"username": "resetuser"}, format="json")
        r2 = self.client.post("/api/auth/forgot-password", {"username": "nonexistent"}, format="json")
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r2.status_code, 200)

        self.assertEqual(r1.json(), r2.json())

    def test_forgot_password_sets_code(self):
        self.client.post("/api/auth/forgot-password", {"username": "resetuser"}, format="json")
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.strVerificationCode)
        self.assertIsNotNone(self.user.password_reset_requested_at)

    def test_reset_password_success(self):
        self.client.post("/api/auth/forgot-password", {"username": "resetuser"}, format="json")
        self.user.refresh_from_db()
        response = self.client.post("/api/auth/reset-password", {
            "username": "resetuser", "code": self.user.strVerificationCode, "new_password": "NewPass1234",
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(verify_password("NewPass1234", self.user.password))
        self.assertIsNone(self.user.strVerificationCode)
        self.assertIsNone(self.user.password_reset_requested_at)

    def test_reset_password_wrong_code(self):
        self.client.post("/api/auth/forgot-password", {"username": "resetuser"}, format="json")
        response = self.client.post("/api/auth/reset-password", {
            "username": "resetuser", "code": "000000", "new_password": "NewPass1234",
        }, format="json")
        self.assertEqual(response.status_code, 400)

    def test_reset_password_expired_code(self):
        self.client.post("/api/auth/forgot-password", {"username": "resetuser"}, format="json")
        self.user.refresh_from_db()
        self.user.password_reset_requested_at = timezone.now() - datetime.timedelta(minutes=31)
        self.user.save()
        response = self.client.post("/api/auth/reset-password", {
            "username": "resetuser", "code": self.user.strVerificationCode, "new_password": "NewPass1234",
        }, format="json")
        self.assertEqual(response.status_code, 400)

    def test_reset_password_too_short(self):
        self.client.post("/api/auth/forgot-password", {"username": "resetuser"}, format="json")
        self.user.refresh_from_db()
        response = self.client.post("/api/auth/reset-password", {
            "username": "resetuser", "code": self.user.strVerificationCode, "new_password": "short",
        }, format="json")
        self.assertEqual(response.status_code, 422)

    def test_reset_password_attempt_limit(self):
        self.client.post("/api/auth/forgot-password", {"username": "resetuser"}, format="json")
        self.user.refresh_from_db()
        self.user.password_reset_attempts = 5
        self.user.save()
        response = self.client.post("/api/auth/reset-password", {
            "username": "resetuser", "code": self.user.strVerificationCode, "new_password": "NewPass1234",
        }, format="json")
        self.assertEqual(response.status_code, 429)

    def test_inactive_user_gets_generic_forgot_password_response(self):
        _make_user("inactiveresetuser", is_active=False)
        response = self.client.post("/api/auth/forgot-password", {"username": "inactiveresetuser"}, format="json")
        self.assertEqual(response.status_code, 200)
        user = UserModel.objects.get(username="inactiveresetuser")
        self.assertIsNone(user.strVerificationCode)


class AccountSettingsTests(APITestCase):
    def setUp(self):
        self.user = _make_user("accountuser", password=hash_password("OriginalPass123"))
        self.auth = f"Bearer {create_access_token(self.user.username)}"

    def test_change_password_wrong_current(self):
        response = self.client.post(
            "/api/auth/change-password", {"current_password": "wrong", "new_password": "NewPass1234"},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 403)

    def test_change_password_new_too_short(self):
        response = self.client.post(
            "/api/auth/change-password", {"current_password": "OriginalPass123", "new_password": "short"},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 422)

    def test_change_password_success(self):
        response = self.client.post(
            "/api/auth/change-password", {"current_password": "OriginalPass123", "new_password": "NewPass1234"},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(verify_password("NewPass1234", self.user.password))

    def test_change_password_requires_auth(self):
        response = self.client.post(
            "/api/auth/change-password", {"current_password": "x", "new_password": "NewPass1234"}, format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_notification_settings_partial_update_preserves_others(self):
        response = self.client.put(
            "/api/auth/settings", {"notify_replies": False}, format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertFalse(body["notify_replies"])
        self.assertTrue(body["notify_reactions"])
        self.assertTrue(body["notify_analysis"])

    def test_deactivate_wrong_password(self):
        response = self.client.post(
            "/api/auth/deactivate", {"password": "wrong"}, format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 403)

    def test_deactivate_success_then_inactive(self):
        response = self.client.post(
            "/api/auth/deactivate", {"password": "OriginalPass123"}, format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.get("/api/auth/me", HTTP_AUTHORIZATION=self.auth)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Inactive user")

    def test_profile_update(self):
        response = self.client.put(
            "/api/auth/profile", {"first_name": "Changed", "strBio": "new bio"},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["first_name"], "Changed")
        self.assertEqual(response.json()["strBio"], "new bio")


class PermissionClassTests(APITestCase):

    def setUp(self):
        self.staff_only = _make_user("staffonly", is_staff=True, is_superuser=False)
        self.admin = _make_user("adminuser", is_staff=False, is_superuser=True)
        self.plain = _make_user("plainuser")

    def test_staff_but_not_admin_cannot_hit_admin_endpoint(self):



        auth = f"Bearer {create_access_token(self.staff_only.username)}"
        response = self.client.post(
            "/api/verisphere/sources/999999/approve/", {}, format="json", HTTP_AUTHORIZATION=auth,
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_without_staff_flag_can_hit_admin_endpoint(self):
        auth = f"Bearer {create_access_token(self.admin.username)}"
        response = self.client.post(
            "/api/verisphere/sources/999999/approve/", {}, format="json", HTTP_AUTHORIZATION=auth,
        )


        self.assertEqual(response.status_code, 404)

    def test_plain_user_cannot_hit_admin_endpoint(self):
        auth = f"Bearer {create_access_token(self.plain.username)}"
        response = self.client.post(
            "/api/verisphere/sources/999999/approve/", {}, format="json", HTTP_AUTHORIZATION=auth,
        )
        self.assertEqual(response.status_code, 403)


class AnalysisUsageModelTests(APITestCase):
    def test_rate_limit_counter_scoped_to_24_hours(self):
        user = _make_user("rateuser")
        old = AnalysisUsageModel.objects.create(user_id=user.id)
        AnalysisUsageModel.objects.filter(id=old.id).update(created_at=timezone.now() - datetime.timedelta(hours=25))
        AnalysisUsageModel.objects.create(user_id=user.id)

        from myapps.verisphere.comments.services import count_analyze_actions_today
        self.assertEqual(count_analyze_actions_today(user.id), 1)
