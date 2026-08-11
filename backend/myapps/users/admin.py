from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from myapps.users.models import AnalysisUsageModel, UserModel


admin.site.register(UserModel, UserAdmin)


@admin.register(AnalysisUsageModel)
class AnalysisUsageAdmin(admin.ModelAdmin):
    list_display = ("id", "user_id", "created_at")
    list_filter = ("created_at",)
