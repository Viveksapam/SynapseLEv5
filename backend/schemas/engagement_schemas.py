from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    type: str
    actor_username: Optional[str] = None
    blog_id: Optional[int] = None
    ref_table: Optional[str] = None
    ref_id: Optional[int] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True

class UnreadCountResponse(BaseModel):
    count: int

class ReputationSummaryResponse(BaseModel):
    total: int
    by_type: Dict[str, int] = {}

class PublicReputationResponse(BaseModel):
    username: str
    total: int
    badges: List[str] = []
