from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from myapps.users.permissions import IsAuthenticatedActive


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def deactivate(request):
    user = request.user
    if not user.check_password(request.data.get("password", "")):
        return Response({"detail": "Password is incorrect"}, status=403)

    user.is_active = False
    user.save(update_fields=["is_active"])
    return Response({"message": "Account deactivated"})
