from django.contrib import admin

from myapps.verisphere.comments.models import (
    BlogCommentModel,
    CommentAnalysisModel,
    CommentAuditCollectionModel,
)


@admin.register(BlogCommentModel)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ("id", "blog", "user", "strAuthor", "strType", "datePosted")
    list_filter = ("strType",)
    search_fields = ("strContent", "strAuthor")


@admin.register(CommentAnalysisModel)
class CommentAnalysisAdmin(admin.ModelAdmin):
    list_display = ("comment", "analyzed_at")


@admin.register(CommentAuditCollectionModel)
class CommentAuditCollectionAdmin(admin.ModelAdmin):
    list_display = ("id", "comment", "blog", "status", "collected_at")
    list_filter = ("status",)
