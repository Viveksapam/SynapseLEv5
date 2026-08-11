from rest_framework.test import APITestCase

from myapps.mainsite.merch.models import ProductModel


class ProductsEndpointTests(APITestCase):
    def test_get_products_empty(self):
        response = self.client.get("/api/product/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_get_products_with_data(self):
        ProductModel.objects.create(strName="Tee", strDescription="d", numPrice=9.99, strCategory="Apparel")
        response = self.client.get("/api/product/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["strName"], "Tee")
