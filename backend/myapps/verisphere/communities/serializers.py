from rest_framework import serializers


class CommunitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    strName = serializers.CharField()
    strDescription = serializers.CharField(allow_null=True)
    register = serializers.CharField()
    analysis_default = serializers.BooleanField()
    member_count = serializers.IntegerField()
    joined = serializers.BooleanField()
    boolCanModerate = serializers.BooleanField()


class CommunityMemberSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role = serializers.CharField()
    status = serializers.CharField()
    joined_at = serializers.DateTimeField(allow_null=True)
    username = serializers.CharField(allow_null=True)


class CommunityCreateSerializer(serializers.Serializer):
    strName = serializers.CharField()
    strDescription = serializers.CharField(required=False, allow_null=True)
    register = serializers.CharField(required=False, default="library")


class CommunityUpdateSerializer(serializers.Serializer):
    strName = serializers.CharField(required=False, allow_null=True)
    strDescription = serializers.CharField(required=False, allow_null=True)
    register = serializers.CharField(required=False, allow_null=True)
    analysis_default = serializers.BooleanField(required=False, allow_null=True)
