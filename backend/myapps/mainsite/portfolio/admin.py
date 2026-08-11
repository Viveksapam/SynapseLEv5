from django.contrib import admin

from myapps.mainsite.portfolio.models import ProjectModel, SkillModel, VideoModel


@admin.register(SkillModel)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("id", "strTitle", "strThemeColor")


@admin.register(VideoModel)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("id", "strTitle", "boolIsFeatured", "dtCreatedAt")
    list_filter = ("boolIsFeatured",)


@admin.register(ProjectModel)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "strName", "strTechStack", "boolIsFeatured")
    list_filter = ("boolIsFeatured",)
