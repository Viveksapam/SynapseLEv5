from rest_framework_simplejwt.tokens import RefreshToken

from myapps.users.models import UserModel


def create_access_token(username: str) -> str:
    user = UserModel.objects.get(username=username)
    return str(RefreshToken.for_user(user).access_token)
