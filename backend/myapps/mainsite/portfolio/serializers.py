from rest_framework import serializers

from myapps.mainsite.portfolio.models import ProjectModel, SkillModel, VideoModel


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillModel
        fields = ["id", "strTitle", "strThemeColor", "strThemeLight", "strIconSvg", "strModalHtml"]


class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoModel
        fields = ["id", "strTitle", "strDescription", "strYoutubeEmbedUrl", "boolIsFeatured", "dtCreatedAt"]


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectModel
        fields = [
            "id", "strName", "strDescription", "strTechStack", "strGithubUrl", "strLiveUrl",
            "boolIsFeatured", "strImageUrl", "strKickerLabel", "strCtaText", "strCtaRoute",
        ]
