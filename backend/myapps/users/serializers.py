from djoser import serializers as djoser_serializers
from rest_framework import serializers

from myapps.users.models import UserModel


class DjoserUserCreateSerializer(djoser_serializers.UserCreateSerializer):
    first_name = serializers.CharField(required=True, allow_blank=False)
    last_name = serializers.CharField(required=True, allow_blank=False)

    class Meta(djoser_serializers.UserCreateSerializer.Meta):
        model = UserModel
        fields = ("id", "username", "email", "first_name", "last_name", "password")

    def validate_username(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters")
        if not value.replace("_", "").replace("-", "").isalnum():
            raise serializers.ValidationError("Username may only contain letters, numbers, - and _")
        return value


class DjoserUserSerializer(djoser_serializers.UserSerializer):
    date_joined = serializers.DateTimeField(format="iso-8601", read_only=True)
    last_login = serializers.DateTimeField(format="iso-8601", read_only=True)

    class Meta(djoser_serializers.UserSerializer.Meta):
        model = UserModel
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "strBio", "strProfilePicUrl", "is_active", "is_staff", "is_superuser",
            "date_joined", "last_login",
            "notify_replies", "notify_reactions", "notify_analysis",
        )
        read_only_fields = ("username", "is_active", "is_staff", "is_superuser", "date_joined", "last_login")
