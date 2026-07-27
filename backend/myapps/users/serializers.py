from rest_framework import serializers

from myapps.users.models import UserModel


class UserResponseSerializer(serializers.ModelSerializer):






    date_joined = serializers.DateTimeField(format="iso-8601")
    last_login = serializers.DateTimeField(format="iso-8601")

    class Meta:
        model = UserModel
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "strBio", "strProfilePicUrl", "is_active", "is_staff", "is_superuser",
            "date_joined", "last_login",
            "notify_replies", "notify_reactions", "notify_analysis",
        ]


class UserCreateSerializer(serializers.Serializer):

    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    password = serializers.CharField()

    def validate_username(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters")
        if not value.replace("_", "").replace("-", "").isalnum():
            raise serializers.ValidationError("Username may only contain letters, numbers, - and _")
        return value

    def validate_first_name(self, value):
        return self._not_blank(value)

    def validate_last_name(self, value):
        return self._not_blank(value)

    @staticmethod
    def _not_blank(value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field cannot be blank")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters")
        return value


class UserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_null=True)
    last_name = serializers.CharField(required=False, allow_null=True)
    strBio = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    strProfilePicUrl = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=200)
