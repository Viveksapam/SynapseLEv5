import datetime
import json

from django.db import models
from django.utils import timezone


class BlogModel(models.Model):
    class Meta:
        db_table = "blog_blogmodel"

    id = models.BigAutoField(primary_key=True)
    author = models.ForeignKey(
        "users.UserModel", db_column="author_id", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="authored_blogs",
    )
    community = models.ForeignKey(
        "communities.CommunityModel", db_column="community_id", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="blogs",
    )
    strTitle = models.CharField(max_length=255)
    strSummary = models.TextField()
    strContent = models.TextField()
    strThemeColor = models.CharField(max_length=50, default="#4f46e5")
    datePublished = models.DateField(default=datetime.date.today)
    strMediaUrl = models.CharField(max_length=500, null=True, blank=True)
    strCategory = models.CharField(max_length=50, null=True, blank=True)
    numReadTime = models.IntegerField(null=True, blank=True)
    numUpvotes = models.IntegerField(default=0, null=True, blank=True)
    comments_count = models.IntegerField(default=0, null=True, blank=True)
    strPostType = models.CharField(max_length=20, default="mixed")
    strAnalysisMode = models.CharField(max_length=20, default="open")
    jsonAllowedAnalysisFocus = models.TextField(null=True, blank=True)

    @property
    def strAuthorUsername(self):
        return self.author.username if self.author else "System"

    @property
    def objCommunity(self):
        return self.community_id

    @property
    def strCommunityName(self):
        return self.community.strName if self.community else "General"

    @property
    def strCommunityRegister(self):
        return self.community.register if self.community else "library"

    @property
    def ai_summary(self):
        analysis = getattr(self, "ai_analysis", None)
        return analysis.ai_summary if analysis else None

    @property
    def ai_context_guardrail(self):
        analysis = getattr(self, "ai_analysis", None)
        return analysis.ai_context_guardrail if analysis else None

    @property
    def analyzed_at(self):
        analysis = getattr(self, "ai_analysis", None)
        return analysis.analyzed_at if analysis else None

    @property
    def analysis_detail(self):
        analysis = getattr(self, "ai_analysis", None)
        raw = analysis.analysis_detail if analysis else None
        if not raw:
            return None
        try:
            return json.loads(raw)
        except (ValueError, TypeError):
            return None

    @property
    def boolAnalysisEnabled(self):
        return self.strAnalysisMode != "off"

    @property
    def sources_count(self):
        from myapps.verisphere.sources.models import BlogSourceModel
        return BlogSourceModel.objects.filter(context__blog_id=self.id).count()


class BlogAIAnalysisModel(models.Model):
    class Meta:
        db_table = "blog_blogaianalysismodel"

    blog = models.OneToOneField(
        BlogModel, db_column="blog_id", on_delete=models.CASCADE,
        primary_key=True, related_name="ai_analysis",
    )
    ai_summary = models.TextField(null=True, blank=True)
    ai_context_guardrail = models.TextField(null=True, blank=True)
    analysis_detail = models.TextField(null=True, blank=True)
    analyzed_at = models.DateTimeField(null=True, blank=True)


class FeaturedBlogModel(models.Model):
    class Meta:
        db_table = "blog_featuredblogmodel"

    blog = models.OneToOneField(
        BlogModel, db_column="blog_id", on_delete=models.CASCADE,
        primary_key=True, related_name="featured",
    )


class PostReactionModel(models.Model):

    class Meta:
        db_table = "blog_postreactionmodel"
        constraints = [
            models.UniqueConstraint(fields=["post", "user", "emoji"], name="uq_reaction_post_user_emoji"),
        ]

    id = models.AutoField(primary_key=True)
    post = models.ForeignKey(
        BlogModel, db_column="post_id", on_delete=models.CASCADE,
        null=True, blank=True, related_name="reactions",
    )
    user = models.ForeignKey(
        "users.UserModel", db_column="user_id", on_delete=models.CASCADE,
        null=True, blank=True, related_name="post_reactions",
    )
    emoji = models.CharField(max_length=50, null=True, blank=True, db_index=True)


class RecentContributionModel(models.Model):
    class Meta:
        db_table = "blog_recentcontributionmodel"

    id = models.AutoField(primary_key=True)
    blog = models.ForeignKey(BlogModel, db_column="blog_id", on_delete=models.CASCADE, related_name="recent_contribution_slots")
    position = models.IntegerField(unique=True)
    added_at = models.DateTimeField(null=True, blank=True, default=timezone.now)
    added_by = models.ForeignKey(
        "users.UserModel", db_column="added_by_id", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="added_recent_contributions",
    )


class BlogAuditCollectionModel(models.Model):
    class Meta:
        db_table = "blog_auditcollectionmodel"

    id = models.AutoField(primary_key=True)
    blog = models.ForeignKey(
        BlogModel, db_column="blog_id", on_delete=models.CASCADE,
        null=True, blank=True, related_name="audit_collections",
    )
    comment_ids = models.TextField(null=True, blank=True)
    source_ids = models.TextField(null=True, blank=True)
    context_ids = models.TextField(null=True, blank=True)
    collected_data = models.TextField(null=True, blank=True)
    llm_response = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=50, null=True, blank=True, default="pending")
    error_message = models.TextField(null=True, blank=True)
    collected_at = models.DateTimeField(null=True, blank=True, default=timezone.now)
    processed_at = models.DateTimeField(null=True, blank=True)
