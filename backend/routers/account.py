"""Account settings: password change, notification preferences, deactivation.

Separate from routers/auth.py to keep both under the file-size cap. Every
control here is real - no placeholder endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from core.deps import get_current_active_user
from core.security import verify_password, get_password_hash
from models.user_models import UserModel
from schemas.user_schemas import UserResponse

router = APIRouter(prefix="/api/auth", tags=["Account"])

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class NotificationSettings(BaseModel):
    notify_replies: Optional[bool] = None
    notify_reactions: Optional[bool] = None
    notify_analysis: Optional[bool] = None

class DeactivateRequest(BaseModel):
    password: str

@router.post("/change-password")
def change_password(body: ChangePasswordRequest, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    if not verify_password(body.current_password, current_user.password):
        raise HTTPException(status_code=403, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="New password must be at least 8 characters")
    current_user.password = get_password_hash(body.new_password)
    db.commit()
    return {"message": "Password updated"}

@router.put("/settings", response_model=UserResponse)
def update_settings(body: NotificationSettings, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    for field in ("notify_replies", "notify_reactions", "notify_analysis"):
        value = getattr(body, field)
        if value is not None:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/deactivate")
def deactivate_account(body: DeactivateRequest, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    if not verify_password(body.password, current_user.password):
        raise HTTPException(status_code=403, detail="Password is incorrect")
    # Soft deactivation: content stays (comments keep their display name), the
    # account simply stops authenticating. Reactivation is an admin action.
    current_user.is_active = False
    db.commit()
    return {"message": "Account deactivated"}
