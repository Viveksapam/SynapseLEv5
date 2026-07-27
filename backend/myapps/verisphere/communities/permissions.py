from rest_framework.exceptions import NotFound, PermissionDenied

from myapps.verisphere.communities import services


def require_creator_or_admin(community_id: int, user):
    community = services.get_community(community_id)
    if not community:
        raise NotFound("Community not found")
    if not user.is_superuser and not services.is_creator(community_id, user.id):
        raise PermissionDenied("Only the community creator can do this")
    return community
