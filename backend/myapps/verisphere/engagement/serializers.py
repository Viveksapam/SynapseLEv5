from rest_framework import serializers

from myapps.verisphere.engagement.models import NotificationModel, UserBadgeModel


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationModel
        fields = ["id", "type", "actor_username", "blog_id", "ref_table", "ref_id", "read_at", "created_at"]


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBadgeModel
        fields = ["badge_slug", "awarded_at"]


class UnreadCountSerializer(serializers.Serializer):
    count = serializers.IntegerField()


class ReputationSummarySerializer(serializers.Serializer):
    total = serializers.IntegerField()
    by_type = serializers.DictField(child=serializers.IntegerField())


class PublicReputationSerializer(serializers.Serializer):
    username = serializers.CharField()
    total = serializers.IntegerField()
    badges = serializers.ListField(child=serializers.CharField())
