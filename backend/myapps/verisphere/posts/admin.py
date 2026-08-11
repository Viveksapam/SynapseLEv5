import cloudinary.uploader
from django import forms
from django.contrib import admin

from myapps.verisphere.posts.models import (
    BlogAIAnalysisModel,
    BlogAuditCollectionModel,
    BlogModel,
    FeaturedBlogModel,
    PostReactionModel,
    RecentContributionModel,
)


class BlogAdminForm(forms.ModelForm):
    fileMediaUpload = forms.ImageField(
        required=False,
        label="Upload image",
        help_text="Uploading a file here replaces the URL below with the resulting Cloudinary link. Leave blank to keep or hand-edit the URL directly.",
    )

    class Meta:
        model = BlogModel
        fields = "__all__"

    def clean_strMediaUrl(self):
        return self.cleaned_data.get("strMediaUrl") or ""


@admin.register(BlogModel)
class BlogAdmin(admin.ModelAdmin):
    form = BlogAdminForm
    list_display = ("id", "strTitle", "author", "community", "datePublished", "numUpvotes")
    list_filter = ("strCategory", "strPostType", "strAnalysisMode")
    search_fields = ("strTitle", "strSummary")
    fieldsets = (
        (None, {
            "fields": ("author", "community", "strTitle", "strSummary", "strContent", "strThemeColor", "datePublished"),
        }),
        ("Media", {
            "fields": ("fileMediaUpload", "strMediaUrl"),
            "description": "Either upload an image or paste a URL directly — not both.",
        }),
        ("Metadata", {
            "fields": ("strCategory", "numReadTime", "numUpvotes", "comments_count", "strPostType", "strAnalysisMode", "jsonAllowedAnalysisFocus"),
        }),
    )

    def save_model(self, request, obj, form, change):
        uploaded_file = form.cleaned_data.get("fileMediaUpload")
        if uploaded_file:
            result = cloudinary.uploader.upload(uploaded_file, folder="synapse")
            obj.strMediaUrl = result["secure_url"]
        super().save_model(request, obj, form, change)


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
