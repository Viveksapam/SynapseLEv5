import cloudinary.uploader
from django import forms
from django.contrib import admin

from myapps.mainsite.portfolio.models import ProjectModel, SkillModel, VideoModel


@admin.register(SkillModel)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("id", "strTitle", "strThemeColor")


@admin.register(VideoModel)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("id", "strTitle", "boolIsFeatured", "dtCreatedAt")
    list_filter = ("boolIsFeatured",)


class ProjectAdminForm(forms.ModelForm):
    fileImageUpload = forms.ImageField(
        required=False,
        label="Upload image",
        help_text="Uploading a file here replaces the URL below with the resulting Cloudinary link. Leave blank to keep or hand-edit the URL directly.",
    )

    class Meta:
        model = ProjectModel
        fields = "__all__"
        widgets = {"strImageUrl": forms.TextInput(attrs={"style": "width: 400px"})}

    def clean_strImageUrl(self):
        return self.cleaned_data.get("strImageUrl") or ""


@admin.register(ProjectModel)
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectAdminForm
    list_display = ("id", "strName", "strTechStack", "boolIsFeatured")
    list_filter = ("boolIsFeatured",)
    fieldsets = (
        (None, {
            "fields": ("strName", "strDescription", "strTechStack", "strGithubUrl", "strLiveUrl", "boolIsFeatured"),
        }),
        ("Image", {
            "fields": ("fileImageUpload", "strImageUrl"),
            "description": "Either upload an image or paste a URL directly — not both.",
        }),
        ("Display", {
            "fields": ("strKickerLabel", "strCtaText", "strCtaRoute"),
        }),
    )

    def save_model(self, request, obj, form, change):
        uploaded_file = form.cleaned_data.get("fileImageUpload")
        if uploaded_file:
            result = cloudinary.uploader.upload(uploaded_file, folder="synapse")
            obj.strImageUrl = result["secure_url"]
        super().save_model(request, obj, form, change)
