from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.mainsite.merch.models import ProductModel
from myapps.mainsite.merch.serializers import ProductSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def products(request):
    skip = int(request.query_params.get("skip", 0))
    limit = int(request.query_params.get("limit", 100))
    qs = ProductModel.objects.all()[skip:skip + limit]
    return Response(ProductSerializer(qs, many=True).data)
