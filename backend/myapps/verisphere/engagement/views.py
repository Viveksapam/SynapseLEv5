from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.verisphere.engagement import services
from myapps.verisphere.engagement.serializers import (
    BadgeSerializer,
    NotificationSerializer,
    PublicReputationSerializer,
    ReputationSummarySerializer,
    UnreadCountSerializer,
)
from myapps.users.permissions import IsAuthenticatedActive


@api_view(["GET"])
@permission_classes([IsAuthenticatedActive])
def list_notifications(request):
    return Response(NotificationSerializer(services.get_notifications(request.user.id), many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedActive])
def unread_count(request):
    return Response(UnreadCountSerializer({"count": services.get_unread_count(request.user.id)}).data)


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def mark_all_read(request):
    return Response({"marked_read": services.mark_all_read(request.user.id)})


@api_view(["GET"])
@permission_classes([IsAuthenticatedActive])
def my_reputation(request):
    return Response(ReputationSummarySerializer(services.get_reputation_summary(request.user.id)).data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedActive])
def my_badges(request):
    return Response(BadgeSerializer(services.get_badges(request.user.id), many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedActive])
def my_recap(request):
    return Response(services.get_recap(request.user.id))





@api_view(["GET"])
@permission_classes([AllowAny])
def public_reputation(request, username):
    from myapps.users.models import UserModel
    user = UserModel.objects.filter(username=username).first()
    if not user:
        raise NotFound("User not found")
    summary = services.get_reputation_summary(user.id)
    badges = [b.badge_slug for b in services.get_badges(user.id)]
    data = {"username": user.username, "total": summary["total"], "badges": badges}
    return Response(PublicReputationSerializer(data).data)
