from django.db import models
from django.utils import timezone


class BlogCommentModel(models.Model):
    class Meta:
        db_table = "blog_blogcommentmodel"

    id = models.BigAutoField(primary_key=True)
    blog = models.ForeignKey(
        "posts.BlogModel", db_column="blog_id", on_delete=models.CASCADE, related_name="comments",
    )
    parent_comment = models.ForeignKey(
        "self", db_column="parent_comment_id", on_delete=models.CASCADE,
        null=True, blank=True, related_name="replies",
    )
    user = models.ForeignKey(
        "users.UserModel", db_column="user_id", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="blog_comments",
    )
    strAuthor = models.CharField(max_length=255, default="Anonymous")
    strContent = models.TextField()
    strType = models.CharField(max_length=30, default="standard", db_index=True)
    jsonAnalysisParams = models.TextField(null=True, blank=True)
    jsonAnalysisResult = models.TextField(null=True, blank=True)
    strModelUsed = models.CharField(max_length=100, null=True, blank=True)
    datePosted = models.DateTimeField(default=timezone.now)

    @property
    def strAiAnalysis(self):
        analysis = getattr(self, "analysis", None)
        return analysis.ai_summary if analysis else None

    @property
    def dictAiMetrics(self):
        analysis = getattr(self, "analysis", None)
        if not analysis:
            return None
        return {"analyzed_at": analysis.analyzed_at.isoformat() if analysis.analyzed_at else None}


class CommentAnalysisModel(models.Model):
    class Meta:
        db_table = "blog_commentanalysismodel"

    comment = models.OneToOneField(
        BlogCommentModel, db_column="comment_id", on_delete=models.CASCADE,
        primary_key=True, related_name="analysis",
    )
    ai_summary = models.TextField(null=True, blank=True)
    analyzed_at = models.DateTimeField(null=True, blank=True)


class CommentAuditCollectionModel(models.Model):
    class Meta:
        db_table = "blog_commentauditcollectionmodel"

    id = models.AutoField(primary_key=True)
    comment = models.ForeignKey(BlogCommentModel, db_column="comment_id", on_delete=models.CASCADE, related_name="audit_collections")
    blog = models.ForeignKey("posts.BlogModel", db_column="blog_id", on_delete=models.CASCADE, related_name="comment_audit_collections")

    collected_data = models.TextField(null=True, blank=True)
    llm_response = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=50, default="pending")
    error_message = models.TextField(null=True, blank=True)
    collected_at = models.DateTimeField(null=True, blank=True, default=timezone.now)
    processed_at = models.DateTimeField(null=True, blank=True)
