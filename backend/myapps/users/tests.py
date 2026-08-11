import datetime

from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from djoser.utils import encode_uid
from rest_framework.test import APITestCase

from myapps.users.authentication import create_access_token
from myapps.users.models import AnalysisUsageModel, UserModel


def _make_user(username, **kwargs):
    defaults = {
        "email": f"{username}@example.com", "first_name": "T", "last_name": "U",
        "is_active": True, "password": make_password("pass12345"),
    }
    defaults.update(kwargs)
    return UserModel.objects.create(username=username, **defaults)


def _uid_token(user):
    return encode_uid(user.pk), default_token_generator.make_token(user)


class AuthFlowTests(APITestCase):
    def test_register_activate_login_me(self):
        response = self.client.post("/api/auth/users/", {
            "username": "testuser1", "email": "testuser1@example.com",
            "first_name": "Test", "last_name": "User", "password": "TestPass!9284",
        }, format="json")
        self.assertEqual(response.status_code, 201)

        user = UserModel.objects.get(username="testuser1")
        self.assertFalse(user.is_active)

        uid, token = _uid_token(user)
        response = self.client.post("/api/auth/users/activation/", {"uid": uid, "token": token}, format="json")
        self.assertEqual(response.status_code, 204)
        user.refresh_from_db()
        self.assertTrue(user.is_active)

        response = self.client.post("/api/auth/jwt/create/", {
            "username": "testuser1", "password": "TestPass!9284",
        }, format="json")
        self.assertEqual(response.status_code, 200)
        access = response.json()["access"]
        refresh = response.json()["refresh"]

        response = self.client.get("/api/auth/users/me/", HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "testuser1")

        response = self.client.post("/api/auth/jwt/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())

        response = self.client.get("/api/auth/users/me/")
        self.assertEqual(response.status_code, 401)

        response = self.client.get("/api/auth/users/me/", HTTP_AUTHORIZATION="Bearer garbage.token.here")
        self.assertEqual(response.status_code, 401)

    def test_login_wrong_password(self):
        _make_user("testuser2", password=make_password("RealPass123"))
        response = self.client.post(
            "/api/auth/jwt/create/", {"username": "testuser2", "password": "WrongPass"}, format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_inactive_user_cannot_login(self):
        _make_user("inactiveuser", is_active=False, password=make_password("RealPass123"))
        response = self.client.post(
            "/api/auth/jwt/create/", {"username": "inactiveuser", "password": "RealPass123"}, format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_inactive_user_rejected_on_protected_endpoint(self):
        user = _make_user("testuser3", is_active=False)
        token = create_access_token(user.username)
        response = self.client.post(
            "/api/auth/deactivate", {"password": "x"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        # SimpleJWT rejects inactive users at the authentication layer itself.
        self.assertEqual(response.status_code, 401)


class ActivationTests(APITestCase):
    def test_wrong_token_rejected(self):
        user = _make_user("activateme", is_active=False)
        uid, _ = _uid_token(user)
        response = self.client.post("/api/auth/users/activation/", {"uid": uid, "token": "bad-token"}, format="json")
        self.assertEqual(response.status_code, 422)
        user.refresh_from_db()
        self.assertFalse(user.is_active)

    def test_already_active_token_rejected(self):
        user = _make_user("alreadyactive", is_active=True)
        uid, token = _uid_token(user)
        response = self.client.post("/api/auth/users/activation/", {"uid": uid, "token": token}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_unknown_uid_rejected(self):
        response = self.client.post("/api/auth/users/activation/", {"uid": "doesnotexist", "token": "x"}, format="json")
        self.assertEqual(response.status_code, 422)


class RegistrationValidationTests(APITestCase):
    def _register(self, **overrides):
        data = {
            "username": "validuser", "email": "validuser@example.com",
            "first_name": "V", "last_name": "U", "password": "ValidPass!9284",
        }
        data.update(overrides)
        return self.client.post("/api/auth/users/", data, format="json")

    def test_username_too_short(self):
        response = self._register(username="ab")
        self.assertEqual(response.status_code, 422)

    def test_username_invalid_characters(self):
        response = self._register(username="bad username!")
        self.assertEqual(response.status_code, 422)

    def test_password_too_short(self):
        response = self._register(password="short")
        self.assertEqual(response.status_code, 422)

    def test_blank_first_name_rejected(self):
        response = self._register(first_name="")
        self.assertEqual(response.status_code, 422)

    def test_invalid_email_rejected(self):
        response = self._register(email="not-an-email")
        self.assertEqual(response.status_code, 422)

    def test_duplicate_username_rejected(self):
        _make_user("validuser")
        response = self._register(email="different@example.com")
        self.assertEqual(response.status_code, 422)

    def test_duplicate_email_rejected(self):
        _make_user("someoneelse", email="validuser@example.com")
        response = self._register()
        self.assertEqual(response.status_code, 422)


class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = _make_user("resetuser")

    def test_reset_password_request_always_204(self):
        r1 = self.client.post("/api/auth/users/reset_password/", {"email": self.user.email}, format="json")
        r2 = self.client.post("/api/auth/users/reset_password/", {"email": "nonexistent@example.com"}, format="json")
        self.assertEqual(r1.status_code, 204)
        self.assertEqual(r2.status_code, 204)

    def test_reset_password_confirm_success(self):
        uid, token = _uid_token(self.user)
        response = self.client.post("/api/auth/users/reset_password_confirm/", {
            "uid": uid, "token": token, "new_password": "NewPass!9284",
        }, format="json")
        self.assertEqual(response.status_code, 204)

        login = self.client.post(
            "/api/auth/jwt/create/", {"username": "resetuser", "password": "NewPass!9284"}, format="json",
        )
        self.assertEqual(login.status_code, 200)

    def test_reset_password_confirm_wrong_token(self):
        uid, _ = _uid_token(self.user)
        response = self.client.post("/api/auth/users/reset_password_confirm/", {
            "uid": uid, "token": "bad-token", "new_password": "NewPass!9284",
        }, format="json")
        self.assertEqual(response.status_code, 422)

    def test_reset_password_confirm_too_short(self):
        uid, token = _uid_token(self.user)
        response = self.client.post("/api/auth/users/reset_password_confirm/", {
            "uid": uid, "token": token, "new_password": "short",
        }, format="json")
        self.assertEqual(response.status_code, 422)


class AccountSettingsTests(APITestCase):
    def setUp(self):
        self.user = _make_user("accountuser", password=make_password("OriginalPass123"))
        self.auth = f"Bearer {create_access_token(self.user.username)}"

    def test_change_password_wrong_current(self):
        response = self.client.post(
            "/api/auth/users/set_password/", {"current_password": "wrong", "new_password": "NewPass!9284"},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 422)

    def test_change_password_success(self):
        response = self.client.post(
            "/api/auth/users/set_password/",
            {"current_password": "OriginalPass123", "new_password": "NewPass!9284"},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 204)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass!9284"))

    def test_change_password_requires_auth(self):
        response = self.client.post(
            "/api/auth/users/set_password/", {"current_password": "x", "new_password": "NewPass!9284"}, format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_profile_and_notification_partial_update(self):
        response = self.client.patch(
            "/api/auth/users/me/",
            {"first_name": "Changed", "strBio": "new bio", "notify_replies": False},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["first_name"], "Changed")
        self.assertEqual(body["strBio"], "new bio")
        self.assertFalse(body["notify_replies"])
        self.assertTrue(body["notify_reactions"])

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
        response = self.client.post(
            "/api/auth/deactivate", {"password": "OriginalPass123"}, format="json", HTTP_AUTHORIZATION=self.auth,
        )
        # SimpleJWT rejects inactive users at the authentication layer itself.
        self.assertEqual(response.status_code, 401)


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
