from django.db import models


class SkillModel(models.Model):
    class Meta:
        db_table = "portfolio_skillmodel"

    id = models.BigAutoField(primary_key=True)
    strTitle = models.CharField(max_length=100)
    strThemeColor = models.CharField(max_length=50, default="#4f46e5")
    strThemeLight = models.CharField(max_length=50, default="rgba(79, 70, 229, 0.1)")
    strIconSvg = models.TextField(null=True, blank=True)
    strModalHtml = models.TextField(null=True, blank=True)


class VideoModel(models.Model):
    class Meta:
        db_table = "portfolio_videomodel"

    id = models.BigAutoField(primary_key=True)
    strTitle = models.CharField(max_length=200)
    strDescription = models.TextField(null=True, blank=True)
    strYoutubeEmbedUrl = models.CharField(max_length=200)
    boolIsFeatured = models.BooleanField(default=False)
    dtCreatedAt = models.DateTimeField(auto_now_add=True)


class ProjectModel(models.Model):
    class Meta:
        db_table = "project_projectmodel"

    id = models.BigAutoField(primary_key=True)
    strName = models.CharField(max_length=200)
    strDescription = models.TextField()
    strTechStack = models.CharField(max_length=255)
    strGithubUrl = models.CharField(max_length=200, null=True, blank=True)
    strLiveUrl = models.CharField(max_length=200, null=True, blank=True)
    boolIsFeatured = models.BooleanField(default=False)
    strImageUrl = models.CharField(max_length=500, null=True, blank=True)
    strKickerLabel = models.CharField(max_length=150, null=True, blank=True)
    strCtaText = models.CharField(max_length=100, null=True, blank=True)
    strCtaRoute = models.CharField(max_length=200, null=True, blank=True)
