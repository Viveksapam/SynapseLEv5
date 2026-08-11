from django.db import models


class ProductModel(models.Model):
    class Meta:
        db_table = "merch_productmodel"




    id = models.AutoField(primary_key=True)
    strName = models.CharField(max_length=150, null=True, blank=True)
    strDescription = models.TextField(null=True, blank=True)
    numPrice = models.FloatField(null=True, blank=True)
    strCategory = models.CharField(max_length=100, null=True, blank=True)
    strImage = models.CharField(max_length=300, null=True, blank=True)
    boolInStock = models.BooleanField(default=True, null=True, blank=True)
