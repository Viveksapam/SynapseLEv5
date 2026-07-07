from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime

class BlogCommentBase(BaseModel):
    # Display name only. On create it is ignored; the server sets it from the
    # authenticated user (see crud_blog.create_blog_comment).
    strAuthor: Optional[str] = "Anonymous"
    strContent: str
    parent_comment_id: Optional[int] = None

class BlogCommentCreate(BlogCommentBase):
    pass

class CommentAnalysisBase(BaseModel):
    ai_summary: Optional[str] = None

class CommentAnalysisCreate(CommentAnalysisBase):
    pass

class BlogCommentResponse(BlogCommentBase):
    id: int
    blog_id: int
    user_id: Optional[int] = None  # null on legacy anonymous comments
    # Analysis-as-comment fields; 'standard' for ordinary comments.
    strType: Optional[str] = "standard"
    jsonAnalysisParams: Optional[str] = None
    jsonAnalysisResult: Optional[str] = None
    strModelUsed: Optional[str] = None
    datePosted: datetime
    # Analysis auto-hydrated from CommentAnalysisModel by ORM properties
    strAiAnalysis: Optional[str] = None
    dictAiMetrics: Optional[Any] = None

    class Config:
        orm_mode = True

class BlogContextBase(BaseModel):
    strTitle: str
    strDescription: Optional[str] = None

class BlogContextCreate(BlogContextBase):
    pass

class BlogSourceBase(BaseModel):
    strTitle: str
    strUrl: str
    strDescription: Optional[str] = None
    strAuthor: Optional[str] = None

class BlogSourceCreate(BlogSourceBase):
    pass

class BlogSourceResponse(BlogSourceBase):
    id: int
    context_id: int
    review_status: str = "pending"
    approved_by: Optional[str] = None  # 'admin', 'moderator', or 'ai'
    approver_name: Optional[str] = None  # username or AI model name
    dtCreatedAt: datetime

    class Config:
        orm_mode = True

class BlogContextResponse(BlogContextBase):
    id: int
    blog_id: int
    dtCreatedAt: datetime
    sources: List[BlogSourceResponse] = []

    class Config:
        orm_mode = True

class BlogAuditCollectionResponse(BaseModel):
    id: int
    blog_id: int
    comment_ids: Optional[str] = None
    source_ids: Optional[str] = None
    context_ids: Optional[str] = None
    collected_data: Optional[str] = None
    llm_response: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    collected_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class BlogResponse(BaseModel):
    id: int
    strTitle: str
    strSummary: str
    strContent: str
    strThemeColor: str
    datePublished: date
    strMediaUrl: Optional[str] = None
    strCategory: Optional[str] = None
    numReadTime: Optional[int] = None
    strAuthorUsername: Optional[str] = 'System'
    objCommunity: Optional[int] = 1
    strCommunityName: Optional[str] = 'General'
    strCommunityRegister: Optional[str] = 'library'
    numUpvotes: Optional[int] = 0
    comments_count: Optional[int] = 0
    sources_count: Optional[int] = 0
    strPostType: Optional[str] = "mixed"
    strAnalysisMode: Optional[str] = "open"
    jsonAllowedAnalysisFocus: Optional[str] = None
    boolAnalysisEnabled: Optional[bool] = True
    ai_summary: Optional[str] = None
    ai_context_guardrail: Optional[str] = None
    analysis_detail: Optional[Any] = None
    analyzed_at: Optional[datetime] = None
    boolIsFeatured: Optional[bool] = False
    contexts: List[BlogContextResponse] = []
    sources: List[BlogSourceResponse] = []

    # Not including comments here directly to keep payload small, as they fetch it via /comments endpoint

    class Config:
        orm_mode = True

class CommentAnalysisResponse(BaseModel):
    comment_id: int
    ai_summary: Optional[str] = None
    analyzed_at: Optional[datetime] = None

    class Config:
        orm_mode = True
