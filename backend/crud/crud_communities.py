"""CRUD for communities and membership (Phase 4: two-register architecture)."""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.blog_models import CommunityModel
from models.engagement_models import CommunityMemberModel

def get_communities(db: Session):
    return db.query(CommunityModel).order_by(CommunityModel.id).all()

def get_community(db: Session, community_id: int):
    return db.query(CommunityModel).filter(CommunityModel.id == community_id).first()

def get_membership(db: Session, community_id: int, user_id: int):
    return (
        db.query(CommunityMemberModel)
        .filter(CommunityMemberModel.community_id == community_id,
                CommunityMemberModel.user_id == user_id)
        .first()
    )

def is_active_member(db: Session, community_id: int, user_id: int) -> bool:
    m = get_membership(db, community_id, user_id)
    return bool(m and m.status == "active")

def is_banned(db: Session, community_id: int, user_id: int) -> bool:
    m = get_membership(db, community_id, user_id)
    return bool(m and m.status == "banned")

def is_creator(db: Session, community_id: int, user_id: int) -> bool:
    m = get_membership(db, community_id, user_id)
    if m and m.role == "creator":
        return True
    c = get_community(db, community_id)
    return bool(c and c.created_by == user_id)

def create_community(db: Session, name: str, description: str, register: str, creator_id: int):
    community = CommunityModel(strName=name, strDescription=description, register=register, created_by=creator_id)
    db.add(community)
    db.commit()
    db.refresh(community)
    db.add(CommunityMemberModel(community_id=community.id, user_id=creator_id, role="creator"))
    db.commit()
    return community

def join_community(db: Session, community_id: int, user_id: int):
    existing = get_membership(db, community_id, user_id)
    if existing:
        # Banned members stay banned; re-joining doesn't launder a ban.
        return existing
    member = CommunityMemberModel(community_id=community_id, user_id=user_id)
    db.add(member)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return get_membership(db, community_id, user_id)
    return member

def leave_community(db: Session, community_id: int, user_id: int) -> bool:
    m = get_membership(db, community_id, user_id)
    if not m or m.role == "creator":
        return False
    db.delete(m)
    db.commit()
    return True

def set_member_status(db: Session, community_id: int, user_id: int, status: str):
    m = get_membership(db, community_id, user_id)
    if not m:
        # Banning a non-member creates a banned membership row so the ban holds.
        m = CommunityMemberModel(community_id=community_id, user_id=user_id, status=status)
        db.add(m)
    else:
        m.status = status
    db.commit()
    return m

def update_community(db: Session, community: CommunityModel, fields: dict):
    for key in ("strName", "strDescription", "register", "analysis_default"):
        if key in fields and fields[key] is not None:
            setattr(community, key, fields[key])
    db.commit()
    db.refresh(community)
    return community

def list_members(db: Session, community_id: int):
    return (
        db.query(CommunityMemberModel)
        .filter(CommunityMemberModel.community_id == community_id)
        .order_by(CommunityMemberModel.joined_at)
        .all()
    )
