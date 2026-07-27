import secrets
from datetime import timedelta

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.users.authentication import create_access_token
from myapps.users.email import send_password_reset_email, send_verification_email
from myapps.users.models import PendingUserModel, UserModel
from myapps.users.passwords import hash_password, needs_rehash, verify_password
from myapps.users.permissions import IsAuthenticatedActive
from myapps.users.serializers import UserCreateSerializer, UserResponseSerializer, UserUpdateSerializer

MAX_VERIFICATION_ATTEMPTS = 5
MAX_RESET_ATTEMPTS = 5
RESET_CODE_EXPIRY_MINUTES = 30


def _new_verification_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _token_response(username: str) -> Response:
    return Response({"access_token": create_access_token(username), "token_type": "bearer"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = UserCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if UserModel.objects.filter(username=data["username"]).exists():
        return Response({"detail": "Username already registered"}, status=400)
    if UserModel.objects.filter(email=data["email"]).exists():
        return Response({"detail": "Email already registered"}, status=400)

    hashed_password = hash_password(data["password"])
    code = _new_verification_code()



    PendingUserModel.objects.filter(username=data["username"]).delete()
    PendingUserModel.objects.filter(email=data["email"]).delete()

    pending = PendingUserModel.objects.create(
        username=data["username"], email=data["email"], password=hashed_password,
        first_name=data["first_name"], last_name=data["last_name"], strVerificationCode=code,
    )
    send_verification_email(pending.email, f"{pending.first_name} {pending.last_name}", code)
    return Response({"message": "Check your email for a verification code."})


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    username = request.data.get("username")
    code = request.data.get("code")

    pending = PendingUserModel.objects.filter(username=username).first()
    if not pending:
        return Response({"detail": "Invalid or expired verification code"}, status=400)

    if pending.verification_attempts >= MAX_VERIFICATION_ATTEMPTS:
        return Response({"detail": "Too many attempts. Request a new code and try again."}, status=429)

    if pending.strVerificationCode != code:
        pending.verification_attempts += 1
        pending.save(update_fields=["verification_attempts"])
        return Response({"detail": "Invalid or expired verification code"}, status=400)

    new_user = UserModel.objects.create(
        username=pending.username, email=pending.email, password=pending.password,
        first_name=pending.first_name, last_name=pending.last_name, is_active=True,
    )
    pending.delete()
    return _token_response(new_user.username)


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_verification(request):
    username = request.data.get("username")
    pending = PendingUserModel.objects.filter(username=username).first()
    if not pending:
        return Response({"detail": "No pending registration found for that username"}, status=404)

    code = _new_verification_code()
    pending.strVerificationCode = code
    pending.verification_attempts = 0
    pending.save(update_fields=["strVerificationCode", "verification_attempts"])
    send_verification_email(pending.email, f"{pending.first_name} {pending.last_name}", code)
    return Response({"message": "Verification code resent"})


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):


    generic_response = Response({"message": "If that account exists, a reset code has been sent."})

    username = request.data.get("username")
    user = UserModel.objects.filter(username=username).first()
    if not user or not user.is_active:
        return generic_response

    code = _new_verification_code()
    user.strVerificationCode = code
    user.password_reset_requested_at = timezone.now()
    user.password_reset_attempts = 0
    user.save(update_fields=["strVerificationCode", "password_reset_requested_at", "password_reset_attempts"])
    send_password_reset_email(user.email, f"{user.first_name} {user.last_name}", code)
    return generic_response


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    username = request.data.get("username")
    code = request.data.get("code")
    new_password = request.data.get("new_password", "")

    user = UserModel.objects.filter(username=username).first()
    expired = (
        not user
        or not user.strVerificationCode
        or not user.password_reset_requested_at
        or timezone.now() - user.password_reset_requested_at > timedelta(minutes=RESET_CODE_EXPIRY_MINUTES)
    )
    if expired:
        return Response({"detail": "Invalid or expired reset code"}, status=400)

    if user.password_reset_attempts >= MAX_RESET_ATTEMPTS:
        return Response({"detail": "Too many attempts. Request a new code and try again."}, status=429)

    if user.strVerificationCode != code:
        user.password_reset_attempts += 1
        user.save(update_fields=["password_reset_attempts"])
        return Response({"detail": "Invalid or expired reset code"}, status=400)

    if len(new_password) < 8:
        return Response({"detail": "Password must be at least 8 characters"}, status=422)

    user.password = hash_password(new_password)
    user.strVerificationCode = None
    user.password_reset_requested_at = None
    user.password_reset_attempts = 0
    user.save(update_fields=["password", "strVerificationCode", "password_reset_requested_at", "password_reset_attempts"])
    return Response({"message": "Password reset. You can now log in."})


@api_view(["POST"])
@permission_classes([AllowAny])
def token(request):




    if "username" not in request.data or "password" not in request.data:
        return Response({"detail": "Field required"}, status=422)

    username = request.data.get("username")
    password = request.data.get("password")

    user = UserModel.objects.filter(username=username).first()
    if not user or not verify_password(password or "", user.password):
        return Response(
            {"detail": "Incorrect username or password"},
            status=401, headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        return Response({"detail": "Please verify your email before logging in"}, status=403)



    if needs_rehash(user.password):
        user.password = hash_password(password)
        user.save(update_fields=["password"])

    return _token_response(user.username)


@api_view(["GET"])
@permission_classes([IsAuthenticatedActive])
def me(request):
    return Response(UserResponseSerializer(request.user).data)


@api_view(["PUT"])
@permission_classes([IsAuthenticatedActive])
def profile(request):
    serializer = UserUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user = request.user
    for field in ("first_name", "last_name", "strBio", "strProfilePicUrl"):
        if field in data and data[field] is not None:
            setattr(user, field, data[field])
    user.save()
    return Response(UserResponseSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def change_password(request):
    current_password = request.data.get("current_password", "")
    new_password = request.data.get("new_password", "")
    user = request.user

    if not verify_password(current_password, user.password):
        return Response({"detail": "Current password is incorrect"}, status=403)
    if len(new_password) < 8:
        return Response({"detail": "New password must be at least 8 characters"}, status=422)

    user.password = hash_password(new_password)
    user.save(update_fields=["password"])
    return Response({"message": "Password updated"})


@api_view(["PUT"])
@permission_classes([IsAuthenticatedActive])
def update_settings(request):
    user = request.user
    for field in ("notify_replies", "notify_reactions", "notify_analysis"):
        value = request.data.get(field)
        if value is not None:
            setattr(user, field, bool(value))
    user.save()
    return Response(UserResponseSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def deactivate(request):
    user = request.user
    if not verify_password(request.data.get("password", ""), user.password):
        return Response({"detail": "Password is incorrect"}, status=403)


    user.is_active = False
    user.save(update_fields=["is_active"])
    return Response({"message": "Account deactivated"})
