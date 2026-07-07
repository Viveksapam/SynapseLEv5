from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CommunityCreate(BaseModel):
    strName: str
    strDescription: Optional[str] = None
    register: Optional[str] = "library"  # lounge | library

class CommunityUpdate(BaseModel):
    strName: Optional[str] = None
    strDescription: Optional[str] = None
    register: Optional[str] = None
    analysis_default: Optional[bool] = None

class CommunityResponse(BaseModel):
    id: int
    strName: str
    strDescription: Optional[str] = None
    register: str = "library"
    analysis_default: bool = True
    member_count: int = 0
    # Viewer-relative flags, filled by the router (not ORM fields).
    joined: bool = False
    boolCanModerate: bool = False

    class Config:
        orm_mode = True

class CommunityMemberResponse(BaseModel):
    user_id: int
    role: str
    status: str
    joined_at: Optional[datetime] = None
    username: Optional[str] = None

class PostCreate(BaseModel):
    strTitle: str
    strContent: str
    strMediaUrl: Optional[str] = None
    strReferences: Optional[str] = None
    community_id: Optional[int] = None  # null = author's profile / general feed
    strPostType: Optional[str] = "mixed"
    strAnalysisMode: Optional[str] = None  # None = community-aware default
    allowed_analysis_focus: Optional[List[str]] = None

class AnalysisSettingsUpdate(BaseModel):
    strAnalysisMode: str
    allowed_analysis_focus: Optional[List[str]] = None

class PostUpdate(BaseModel):
    strTitle: Optional[str] = None
    strContent: Optional[str] = None
    strMediaUrl: Optional[str] = None
    strPostType: Optional[str] = None
