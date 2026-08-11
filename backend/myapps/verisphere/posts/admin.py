from django.contrib import admin

from myapps.verisphere.posts.models import (
    BlogAIAnalysisModel,
    BlogAuditCollectionModel,
    BlogModel,
    FeaturedBlogModel,
    PostReactionModel,
    RecentContributionModel,
)


@admin.register(BlogModel)
class BlogAdmin(admin.ModelAdmin):
    list_display = ("id", "strTitle", "author", "community", "datePublished", "numUpvotes")
    list_filter = ("strCategory", "strPostType", "strAnalysisMode")
    search_fields = ("strTitle", "strSummary")


@admin.register(BlogAIAnalysisModel)
class BlogAIAnalysisAdmin(admin.ModelAdmin):
    list_display = ("blog", "analyzed_at")


@admin.register(FeaturedBlogModel)
class FeaturedBlogAdmin(admin.ModelAdmin):
    list_display = ("blog",)


@admin.register(PostReactionModel)
class PostReactionAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "emoji")


@admin.register(RecentContributionModel)
class RecentContributionAdmin(admin.ModelAdmin):
    list_display = ("id", "blog", "position", "added_at")


@admin.register(BlogAuditCollectionModel)
class BlogAuditCollectionAdmin(admin.ModelAdmin):
    list_display = ("id", "blog", "status", "collected_at")
    list_filter = ("status",)
