from django.contrib import admin

from myapps.verisphere.sources.models import BlogContextModel, BlogSourceModel


@admin.register(BlogContextModel)
class BlogContextAdmin(admin.ModelAdmin):
    list_display = ("id", "blog", "strTitle", "dtCreatedAt")


@admin.register(BlogSourceModel)
class BlogSourceAdmin(admin.ModelAdmin):
    list_display = ("id", "context", "strTitle", "strUrl", "review_status")
    list_filter = ("review_status",)
