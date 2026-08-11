from django.contrib import admin

from myapps.mainsite.merch.models import ProductModel


@admin.register(ProductModel)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "strName", "numPrice", "strCategory", "boolInStock")
    list_filter = ("boolInStock", "strCategory")
