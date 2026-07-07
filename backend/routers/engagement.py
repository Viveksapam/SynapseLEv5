from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from crud import crud_engagement
from core.deps import get_current_active_user
from models.user_models import UserModel
from schemas.engagement_schemas import (
    NotificationResponse, UnreadCountResponse, ReputationSummaryResponse, PublicReputationResponse,
)

router = APIRouter(prefix="/api/engagement", tags=["Engagement"])

@router.get("/notifications/", response_model=List[NotificationResponse])
def list_notifications(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    return crud_engagement.get_notifications(db, current_user.id)

@router.get("/notifications/unread-count/", response_model=UnreadCountResponse)
def unread_count(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    return {"count": crud_engagement.get_unread_count(db, current_user.id)}

@router.post("/notifications/mark-all-read/")
def mark_all_read(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    updated = crud_engagement.mark_all_read(db, current_user.id)
    return {"marked_read": updated}

@router.get("/reputation/me/", response_model=ReputationSummaryResponse)
def my_reputation(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    return crud_engagement.get_reputation_summary(db, current_user.id)

@router.get("/badges/me/")
def my_badges(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    return [
        {"badge_slug": b.badge_slug, "awarded_at": b.awarded_at}
        for b in crud_engagement.get_badges(db, current_user.id)
    ]

@router.get("/recap/me/")
def my_recap(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    return crud_engagement.get_recap(db, current_user.id)

# Public by design: reputation is a recognition signal others are meant to see.
# Only the total is exposed; the per-type breakdown stays private to the owner.
@router.get("/reputation/{username}/", response_model=PublicReputationResponse)
def public_reputation(username: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    summary = crud_engagement.get_reputation_summary(db, user.id)
    badges = [b.badge_slug for b in crud_engagement.get_badges(db, user.id)]
    return {"username": user.username, "total": summary["total"], "badges": badges}
