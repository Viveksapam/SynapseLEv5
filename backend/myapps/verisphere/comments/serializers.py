from rest_framework import serializers

from myapps.verisphere.comments.models import BlogCommentModel, CommentAnalysisModel


class BlogCommentSerializer(serializers.ModelSerializer):
    strAiAnalysis = serializers.ReadOnlyField()
    dictAiMetrics = serializers.ReadOnlyField()
    datePosted = serializers.DateTimeField(format="iso-8601")

    class Meta:
        model = BlogCommentModel
        fields = [
            "id", "blog_id", "user_id", "strAuthor", "strContent", "parent_comment_id",
            "strType", "jsonAnalysisParams", "jsonAnalysisResult", "strModelUsed", "datePosted",
            "strAiAnalysis", "dictAiMetrics",
        ]


class CommentAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentAnalysisModel
        fields = ["comment_id", "ai_summary", "analyzed_at"]


class BlogCommentCreateSerializer(serializers.Serializer):
    strAuthor = serializers.CharField(required=False, default="Anonymous")
    strContent = serializers.CharField()
    parent_comment_id = serializers.IntegerField(required=False, allow_null=True, default=None)


class CommentAnalysisCreateSerializer(serializers.Serializer):
    ai_summary = serializers.CharField(required=False, allow_null=True)


class AnalysisRequestCreateSerializer(serializers.Serializer):
    focus = serializers.CharField(required=False, default="fact_check")
    depth = serializers.CharField(required=False, default="quick")
    tone = serializers.CharField(required=False, default="match")
    custom_instruction = serializers.CharField(required=False, default="", allow_blank=True)
