from django.db import models
from django.utils import timezone


class BlogContextModel(models.Model):
    class Meta:
        db_table = "blog_blogcontextmodel"

    id = models.AutoField(primary_key=True)
    blog = models.ForeignKey(
        "posts.BlogModel", db_column="blog_id", on_delete=models.CASCADE,
        null=True, blank=True, related_name="contexts",
    )
    strTitle = models.CharField(max_length=255, null=True, blank=True)
    strDescription = models.TextField(null=True, blank=True)
    dtCreatedAt = models.DateTimeField(null=True, blank=True, default=timezone.now)


class BlogSourceModel(models.Model):
    class Meta:
        db_table = "blog_blogsourcemodel"

    id = models.AutoField(primary_key=True)
    context = models.ForeignKey(
        BlogContextModel, db_column="context_id", on_delete=models.CASCADE,
        null=True, blank=True, related_name="sources",
    )
    strTitle = models.TextField(null=True, blank=True)
    strUrl = models.CharField(max_length=500, null=True, blank=True)
    strDescription = models.TextField(null=True, blank=True)
    strAuthor = models.CharField(max_length=255, null=True, blank=True)
    review_status = models.CharField(max_length=20, default="pending")
    approved_by = models.CharField(max_length=20, null=True, blank=True)
    approver_name = models.CharField(max_length=100, null=True, blank=True)
    dtCreatedAt = models.DateTimeField(null=True, blank=True, default=timezone.now)
