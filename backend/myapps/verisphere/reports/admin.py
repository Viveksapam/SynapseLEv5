from django.contrib import admin

from myapps.verisphere.reports.models import ReportModel


@admin.register(ReportModel)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "content_type", "content_id", "reporter", "status", "created_at")
    list_filter = ("status", "content_type")
