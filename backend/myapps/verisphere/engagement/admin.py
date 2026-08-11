from django.contrib import admin

from myapps.verisphere.engagement.models import (
    CommunityMemberModel,
    NotificationModel,
    ReputationEventModel,
    UserBadgeModel,
)


@admin.register(CommunityMemberModel)
class CommunityMemberAdmin(admin.ModelAdmin):
    list_display = ("id", "community", "user", "role", "status", "joined_at")
    list_filter = ("role", "status")


@admin.register(UserBadgeModel)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "badge_slug", "community_id", "awarded_at")


@admin.register(ReputationEventModel)
class ReputationEventAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "actor", "event_type", "weight", "created_at")
    list_filter = ("event_type",)


@admin.register(NotificationModel)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "type", "read_at", "created_at")
    list_filter = ("type",)
