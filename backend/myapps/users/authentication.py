from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header

from myapps.users.models import UserModel


def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": username, "exp": expire}, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


class LegacyJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header or header[0].lower() != b"bearer" or len(header) != 2:

            return None

        token = header[1].decode()
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            username = payload.get("sub")
            if username is None:
                raise jwt.InvalidTokenError("missing sub claim")
            user = UserModel.objects.get(username=username)
        except (jwt.InvalidTokenError, UserModel.DoesNotExist):


            request._jwt_auth_failure = "invalid_token"
            return None

        return (user, token)

    def authenticate_header(self, request):

        return "Bearer"
