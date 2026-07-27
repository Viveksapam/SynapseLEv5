import datetime

from django.db import models
from django.utils import timezone


class CommunityMemberModel(models.Model):

    class Meta:
        db_table = "community_members"
        constraints = [
            models.UniqueConstraint(fields=["community", "user"], name="uq_member_community_user"),
        ]

    id = models.AutoField(primary_key=True)
    community = models.ForeignKey(
        "communities.CommunityModel", db_column="community_id", on_delete=models.CASCADE, related_name="memberships",
    )
    user = models.ForeignKey(
        "users.UserModel", db_column="user_id", on_delete=models.CASCADE, related_name="community_memberships",
    )
    role = models.CharField(max_length=20, default="member")
    status = models.CharField(max_length=20, default="active")
    joined_at = models.DateTimeField(null=True, blank=True, default=timezone.now)


class UserBadgeModel(models.Model):

    class Meta:
        db_table = "user_badges"
        constraints = [
            models.UniqueConstraint(fields=["user", "badge_slug"], name="uq_badge_user_slug"),
        ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey("users.UserModel", db_column="user_id", on_delete=models.CASCADE, related_name="badges")
    badge_slug = models.CharField(max_length=50)
    community_id = models.IntegerField(null=True, blank=True)
    ref_table = models.CharField(max_length=50, null=True, blank=True)
    ref_id = models.IntegerField(null=True, blank=True)
    awarded_at = models.DateTimeField(null=True, blank=True, default=timezone.now)


class ReputationEventModel(models.Model):

    class Meta:
        db_table = "user_reputationeventmodel"

    id = models.AutoField(primary_key=True)

    user = models.ForeignKey("users.UserModel", db_column="user_id", on_delete=models.CASCADE, related_name="reputation_events")

    actor = models.ForeignKey(
        "users.UserModel", db_column="actor_id", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reputation_events_caused",
    )
    event_type = models.CharField(max_length=50)
    weight = models.IntegerField()

    ref_table = models.CharField(max_length=50, null=True, blank=True)
    ref_id = models.IntegerField(null=True, blank=True)

    community_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)


class NotificationModel(models.Model):

    class Meta:
        db_table = "user_notificationmodel"
        indexes = [models.Index(fields=["user", "read_at"], name="ix_notification_user_read")]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey("users.UserModel", db_column="user_id", on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=50)


    actor_username = models.CharField(max_length=255, null=True, blank=True)

    blog_id = models.IntegerField(null=True, blank=True)
    ref_table = models.CharField(max_length=50, null=True, blank=True)
    ref_id = models.IntegerField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
