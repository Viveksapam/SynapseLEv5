from rest_framework import serializers


class ReportCreateSerializer(serializers.Serializer):
    content_type = serializers.CharField()
    content_id = serializers.IntegerField()
    reason = serializers.CharField()


class ReportResolveSerializer(serializers.Serializer):
    action = serializers.CharField()
