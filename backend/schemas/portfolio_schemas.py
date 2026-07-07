from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SkillResponse(BaseModel):
    id: int
    strTitle: str
    strThemeColor: str
    strThemeLight: str
    strIconSvg: Optional[str] = None
    strModalHtml: Optional[str] = None

    class Config:
        orm_mode = True

class VideoResponse(BaseModel):
    id: int
    strTitle: str
    strDescription: Optional[str] = None
    strYoutubeEmbedUrl: str
    boolIsFeatured: bool
    dtCreatedAt: datetime

    class Config:
        orm_mode = True

class ProjectResponse(BaseModel):
    id: int
    strName: str
    strDescription: str
    strTechStack: str
    strGithubUrl: Optional[str] = None
    strLiveUrl: Optional[str] = None
    boolIsFeatured: bool
    strImageUrl: Optional[str] = None
    strKickerLabel: Optional[str] = None
    strCtaText: Optional[str] = None
    strCtaRoute: Optional[str] = None

    class Config:
        orm_mode = True
