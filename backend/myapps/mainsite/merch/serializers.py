from rest_framework import serializers

from myapps.mainsite.merch.models import ProductModel


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductModel
        fields = ["id", "strName", "strDescription", "numPrice", "strCategory", "strImage", "boolInStock"]
