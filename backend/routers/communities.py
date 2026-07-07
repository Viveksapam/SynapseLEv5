"""Community endpoints: listing, membership, and creator moderation tools."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from crud import crud_communities
from core.deps import get_current_active_user, get_current_user_optional
from models.user_models import UserModel
from schemas.community_schemas import (
    CommunityCreate, CommunityUpdate, CommunityResponse, CommunityMemberResponse,
)

router = APIRouter(prefix="/api/verisphere", tags=["Communities"])

_REGISTERS = {"lounge", "library"}

def _to_response(db, community, viewer) -> dict:
    joined = can_moderate = False
    if viewer:
        joined = crud_communities.is_active_member(db, community.id, viewer.id)
        can_moderate = viewer.is_superuser or crud_communities.is_creator(db, community.id, viewer.id)
    return {
        "id": community.id, "strName": community.strName, "strDescription": community.strDescription,
        "register": community.register, "analysis_default": community.analysis_default,
        "member_count": community.member_count, "joined": joined, "boolCanModerate": can_moderate,
    }

def _require_creator_or_admin(db, community_id: int, user: UserModel):
    community = crud_communities.get_community(db, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    if not user.is_superuser and not crud_communities.is_creator(db, community_id, user.id):
        raise HTTPException(status_code=403, detail="Only the community creator can do this")
    return community

@router.get("/communities/", response_model=List[CommunityResponse])
def list_communities(db: Session = Depends(get_db), viewer: UserModel = Depends(get_current_user_optional)):
    return [_to_response(db, c, viewer) for c in crud_communities.get_communities(db)]

@router.get("/communities/{community_id}", response_model=CommunityResponse)
def get_community(community_id: int, db: Session = Depends(get_db), viewer: UserModel = Depends(get_current_user_optional)):
    community = crud_communities.get_community(db, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    return _to_response(db, community, viewer)

@router.post("/communities/", response_model=CommunityResponse)
def create_community(body: CommunityCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    if body.register not in _REGISTERS:
        raise HTTPException(status_code=422, detail="register must be 'lounge' or 'library'")
    name = body.strName.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Community name is required")
    community = crud_communities.create_community(db, name, body.strDescription, body.register, current_user.id)
    return _to_response(db, community, current_user)

@router.put("/communities/{community_id}", response_model=CommunityResponse)
def update_community(community_id: int, body: CommunityUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    community = _require_creator_or_admin(db, community_id, current_user)
    if body.register is not None and body.register not in _REGISTERS:
        raise HTTPException(status_code=422, detail="register must be 'lounge' or 'library'")
    community = crud_communities.update_community(db, community, body.dict(exclude_unset=True))
    return _to_response(db, community, current_user)

@router.post("/communities/{community_id}/join")
def join_community(community_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    if not crud_communities.get_community(db, community_id):
        raise HTTPException(status_code=404, detail="Community not found")
    member = crud_communities.join_community(db, community_id, current_user.id)
    if member.status == "banned":
        raise HTTPException(status_code=403, detail="You are banned from this community")
    return {"status": "joined"}

@router.post("/communities/{community_id}/leave")
def leave_community(community_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    if not crud_communities.leave_community(db, community_id, current_user.id):
        raise HTTPException(status_code=400, detail="Not a leavable membership (creators cannot leave their community)")
    return {"status": "left"}

@router.get("/communities/{community_id}/members/", response_model=List[CommunityMemberResponse])
def list_members(community_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    _require_creator_or_admin(db, community_id, current_user)
    members = crud_communities.list_members(db, community_id)
    users = {u.id: u.username for u in db.query(UserModel).filter(UserModel.id.in_([m.user_id for m in members])).all()} if members else {}
    return [
        {"user_id": m.user_id, "role": m.role, "status": m.status, "joined_at": m.joined_at, "username": users.get(m.user_id)}
        for m in members
    ]

@router.post("/communities/{community_id}/ban/{user_id}")
def ban_member(community_id: int, user_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    _require_creator_or_admin(db, community_id, current_user)
    if crud_communities.is_creator(db, community_id, user_id):
        raise HTTPException(status_code=400, detail="The creator cannot be banned")
    crud_communities.set_member_status(db, community_id, user_id, "banned")
    return {"status": "banned"}

@router.post("/communities/{community_id}/unban/{user_id}")
def unban_member(community_id: int, user_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    _require_creator_or_admin(db, community_id, current_user)
    crud_communities.set_member_status(db, community_id, user_id, "active")
    return {"status": "active"}
