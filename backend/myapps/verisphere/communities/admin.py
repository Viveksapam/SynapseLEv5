from django.contrib import admin

from myapps.verisphere.communities.models import CommunityModel


@admin.register(CommunityModel)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ("id", "strName", "register", "analysis_default", "created_by", "dtCreatedAt")
    list_filter = ("register", "analysis_default")
    search_fields = ("strName",)
