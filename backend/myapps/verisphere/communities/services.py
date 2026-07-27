from django.db import IntegrityError

from myapps.verisphere.communities.models import CommunityModel
from myapps.verisphere.engagement.models import CommunityMemberModel


def get_communities():
    return list(CommunityModel.objects.order_by("id"))


def get_community(community_id: int):
    return CommunityModel.objects.filter(id=community_id).first()


def get_membership(community_id: int, user_id: int):
    return CommunityMemberModel.objects.filter(community_id=community_id, user_id=user_id).first()


def is_active_member(community_id: int, user_id: int) -> bool:
    m = get_membership(community_id, user_id)
    return bool(m and m.status == "active")


def is_banned(community_id: int, user_id: int) -> bool:
    m = get_membership(community_id, user_id)
    return bool(m and m.status == "banned")


def is_creator(community_id: int, user_id: int) -> bool:
    m = get_membership(community_id, user_id)
    if m and m.role == "creator":
        return True
    c = get_community(community_id)
    return bool(c and c.created_by_id == user_id)


def create_community(name: str, description: str, register: str, creator_id: int):
    community = CommunityModel.objects.create(
        strName=name, strDescription=description, register=register, created_by_id=creator_id,
    )
    CommunityMemberModel.objects.create(community_id=community.id, user_id=creator_id, role="creator")
    return community


def join_community(community_id: int, user_id: int):
    existing = get_membership(community_id, user_id)
    if existing:
        return existing
    try:
        return CommunityMemberModel.objects.create(community_id=community_id, user_id=user_id)
    except IntegrityError:
        return get_membership(community_id, user_id)


def leave_community(community_id: int, user_id: int) -> bool:
    m = get_membership(community_id, user_id)
    if not m or m.role == "creator":
        return False
    m.delete()
    return True


def set_member_status(community_id: int, user_id: int, status: str):
    m = get_membership(community_id, user_id)
    if not m:
        m = CommunityMemberModel.objects.create(community_id=community_id, user_id=user_id, status=status)
    else:
        m.status = status
        m.save()
    return m


def update_community(community: CommunityModel, fields: dict):
    for key in ("strName", "strDescription", "register", "analysis_default"):
        if key in fields and fields[key] is not None:
            setattr(community, key, fields[key])
    community.save()
    return community


def list_members(community_id: int):
    return list(CommunityMemberModel.objects.filter(community_id=community_id).order_by("joined_at"))
