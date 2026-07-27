from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.verisphere.communities import permissions as community_permissions
from myapps.verisphere.communities import services
from myapps.verisphere.communities.serializers import (
    CommunityCreateSerializer,
    CommunityMemberSerializer,
    CommunitySerializer,
    CommunityUpdateSerializer,
)
from myapps.users.permissions import IsAuthenticatedActive
from myproject.view_helpers import require_active, validated

_REGISTERS = {"lounge", "library"}


def _community_to_response(community, viewer):
    joined = can_moderate = False
    if viewer and viewer.is_authenticated:
        joined = services.is_active_member(community.id, viewer.id)
        can_moderate = viewer.is_superuser or services.is_creator(community.id, viewer.id)
    return {
        "id": community.id, "strName": community.strName, "strDescription": community.strDescription,
        "register": community.register, "analysis_default": community.analysis_default,
        "member_count": community.member_count, "joined": joined, "boolCanModerate": can_moderate,
    }


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def communities_list(request):
    if request.method == "GET":
        viewer = request.user if request.user.is_authenticated else None
        data = [_community_to_response(c, viewer) for c in services.get_communities()]
        return Response(CommunitySerializer(data, many=True).data)

    require_active(request)
    current_user = request.user
    data = validated(CommunityCreateSerializer, request.data)
    if data["register"] not in _REGISTERS:
        raise ValidationError("register must be 'lounge' or 'library'")
    name = data["strName"].strip()
    if not name:
        raise ValidationError("Community name is required")
    community = services.create_community(name, data.get("strDescription"), data["register"], current_user.id)
    return Response(CommunitySerializer(_community_to_response(community, current_user)).data)


@api_view(["GET", "PUT"])
@permission_classes([AllowAny])
def community_detail(request, community_id):
    if request.method == "GET":
        community = services.get_community(community_id)
        if not community:
            raise NotFound("Community not found")
        viewer = request.user if request.user.is_authenticated else None
        return Response(CommunitySerializer(_community_to_response(community, viewer)).data)

    require_active(request)
    current_user = request.user
    community = community_permissions.require_creator_or_admin(community_id, current_user)
    data = validated(CommunityUpdateSerializer, request.data)
    if data.get("register") is not None and data["register"] not in _REGISTERS:
        raise ValidationError("register must be 'lounge' or 'library'")
    community = services.update_community(community, {k: v for k, v in data.items() if v is not None})
    return Response(CommunitySerializer(_community_to_response(community, current_user)).data)


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def join_community(request, community_id):
    if not services.get_community(community_id):
        raise NotFound("Community not found")
    member = services.join_community(community_id, request.user.id)
    if member.status == "banned":
        raise PermissionDenied("You are banned from this community")
    return Response({"status": "joined"})


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def leave_community(request, community_id):
    if not services.leave_community(community_id, request.user.id):
        raise ValidationError("Not a leavable membership (creators cannot leave their community)")
    return Response({"status": "left"})


@api_view(["GET"])
@permission_classes([IsAuthenticatedActive])
def list_members(request, community_id):
    community_permissions.require_creator_or_admin(community_id, request.user)
    members = services.list_members(community_id)
    from myapps.users.models import UserModel
    usernames = {
        u.id: u.username
        for u in UserModel.objects.filter(id__in=[m.user_id for m in members])
    } if members else {}
    data = [
        {"user_id": m.user_id, "role": m.role, "status": m.status, "joined_at": m.joined_at, "username": usernames.get(m.user_id)}
        for m in members
    ]
    return Response(CommunityMemberSerializer(data, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def ban_member(request, community_id, user_id):
    community_permissions.require_creator_or_admin(community_id, request.user)
    if services.is_creator(community_id, user_id):
        raise ValidationError("The creator cannot be banned")
    services.set_member_status(community_id, user_id, "banned")
    return Response({"status": "banned"})


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def unban_member(request, community_id, user_id):
    community_permissions.require_creator_or_admin(community_id, request.user)
    services.set_member_status(community_id, user_id, "active")
    return Response({"status": "active"})
