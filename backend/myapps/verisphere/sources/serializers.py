from rest_framework import serializers

from myapps.verisphere.sources.models import BlogContextModel, BlogSourceModel


class BlogSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogSourceModel
        fields = [
            "id", "context_id", "strTitle", "strUrl", "strDescription", "strAuthor",
            "review_status", "approved_by", "approver_name", "dtCreatedAt",
        ]


class BlogContextSerializer(serializers.ModelSerializer):
    sources = BlogSourceSerializer(many=True, read_only=True)

    class Meta:
        model = BlogContextModel
        fields = ["id", "blog_id", "strTitle", "strDescription", "dtCreatedAt", "sources"]


class BlogContextCreateSerializer(serializers.Serializer):
    strTitle = serializers.CharField()
    strDescription = serializers.CharField(required=False, allow_null=True)


class BlogSourceCreateSerializer(serializers.Serializer):
    strTitle = serializers.CharField()
    strUrl = serializers.CharField()
    strDescription = serializers.CharField(required=False, allow_null=True)
    strAuthor = serializers.CharField(required=False, allow_null=True)
