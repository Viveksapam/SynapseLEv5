from django.db import models
from django.utils import timezone


class ReportModel(models.Model):

    class Meta:
        db_table = "blog_reportmodel"

    id = models.AutoField(primary_key=True)
    content_type = models.CharField(max_length=20)
    content_id = models.IntegerField(db_index=True)
    reporter = models.ForeignKey(
        "users.UserModel", db_column="reporter_id", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reports_filed",
    )
    reason = models.CharField(max_length=500)
    status = models.CharField(max_length=20, default="open", db_index=True)
    created_at = models.DateTimeField(null=True, blank=True, default=timezone.now)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        "users.UserModel", db_column="resolved_by_id", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reports_resolved",
    )
