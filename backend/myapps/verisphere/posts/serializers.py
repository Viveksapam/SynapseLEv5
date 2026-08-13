from rest_framework import serializers

from myapps.verisphere.posts.models import BlogAuditCollectionModel, BlogModel


class BlogResponseSerializer(serializers.ModelSerializer):
    boolIsFeatured = serializers.SerializerMethodField()
    contexts = serializers.SerializerMethodField()
    sources = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    sources_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogModel
        fields = [
            "id", "strTitle", "strSummary", "strContent", "strThemeColor", "datePublished",
            "strMediaUrl", "strCategory", "numReadTime", "strAuthorUsername", "strAuthorProfilePicUrl", "objCommunity",
            "strCommunityName", "strCommunityRegister", "numUpvotes", "comments_count",
            "sources_count", "strPostType", "strAnalysisMode", "jsonAllowedAnalysisFocus",
            "boolAnalysisEnabled", "ai_summary", "ai_context_guardrail", "analysis_detail",
            "analyzed_at", "boolIsFeatured", "contexts", "sources",
        ]

    def get_comments_count(self, obj):
        annotated = getattr(obj, "annotated_comments_count", None)
        return annotated if annotated is not None else obj.comments_count

    def get_sources_count(self, obj):
        annotated = getattr(obj, "annotated_sources_count", None)
        return annotated if annotated is not None else obj.sources_count

    def get_boolIsFeatured(self, obj):
        annotated = getattr(obj, "is_featured", None)
        if annotated is not None:
            return annotated
        featured_ids = self.context.get("featured_ids")
        if featured_ids is not None:
            return obj.id in featured_ids
        return hasattr(obj, "featured")

    def get_contexts(self, obj):
        if not self.context.get("include_flattened_sources"):
            return []
        from myapps.verisphere.sources.serializers import BlogContextSerializer
        return BlogContextSerializer(obj.contexts.all(), many=True).data

    def get_sources(self, obj):
        if not self.context.get("include_flattened_sources"):
            return []
        from myapps.verisphere.sources.models import BlogSourceModel
        from myapps.verisphere.sources.serializers import BlogSourceSerializer
        sources = BlogSourceModel.objects.filter(context__blog_id=obj.id)
        return BlogSourceSerializer(sources, many=True).data


class BlogAuditCollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogAuditCollectionModel
        fields = [
            "id", "blog_id", "comment_ids", "source_ids", "context_ids", "collected_data",
            "llm_response", "status", "error_message", "collected_at", "processed_at",
        ]


class ReactionRequestSerializer(serializers.Serializer):
    emoji = serializers.CharField()


class RecentContributionPositionSerializer(serializers.Serializer):
    blog_id = serializers.IntegerField()
    position = serializers.IntegerField()


class PostCreateSerializer(serializers.Serializer):
    strTitle = serializers.CharField()
    strContent = serializers.CharField()
    strMediaUrl = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    strReferences = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    community_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    strPostType = serializers.CharField(required=False, default="mixed")
    strAnalysisMode = serializers.CharField(required=False, allow_null=True, default=None)
    allowed_analysis_focus = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True, default=None)


class PostUpdateSerializer(serializers.Serializer):
    strTitle = serializers.CharField(required=False, allow_null=True)
    strContent = serializers.CharField(required=False, allow_null=True)
    strMediaUrl = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    strPostType = serializers.CharField(required=False, allow_null=True)


class AnalysisSettingsUpdateSerializer(serializers.Serializer):
    strAnalysisMode = serializers.CharField()
    allowed_analysis_focus = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True, default=None)
