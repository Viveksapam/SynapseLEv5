"""Post creation with author-side controls, plus post-level moderation.

Destination: community_id null = the author's profile / general feed; otherwise
the author must be an active member of the community. Analysis consent (open /
limited / off) is the author's and is revocable after publishing.
"""
import json
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from crud import crud_blog, crud_communities, crud_engagement
from core.deps import get_current_active_user
from models.user_models import UserModel
from models.blog_models import BlogModel
from schemas.blog_schemas import BlogResponse
from schemas.community_schemas import PostCreate, AnalysisSettingsUpdate, PostUpdate

router = APIRouter(prefix="/api/verisphere", tags=["Posts"])

POST_TYPES = {"claim", "opinion", "musing", "satire", "question", "mixed"}
ANALYSIS_MODES = {"open", "limited", "off"}
FOCUS_OPTIONS = {"fact_check", "sources", "logic", "clarity", "react_in_kind"}

def _derive_summary(content: str, limit: int = 180) -> str:
    # Markdown-ish strip: headings, emphasis, links, code fences.
    text = re.sub(r"[#*_`>\[\]()!-]", " ", content)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit] + ("..." if len(text) > limit else "")

def _validate_analysis(mode, focus_list):
    if mode not in ANALYSIS_MODES:
        raise HTTPException(status_code=422, detail=f"strAnalysisMode must be one of {sorted(ANALYSIS_MODES)}")
    if mode == "limited":
        if not focus_list or not set(focus_list) <= FOCUS_OPTIONS:
            raise HTTPException(status_code=422, detail=f"allowed_analysis_focus must be a non-empty subset of {sorted(FOCUS_OPTIONS)}")
        return json.dumps(sorted(set(focus_list)))
    return None

@router.post("/blogs/", response_model=BlogResponse)
def create_post(body: PostCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    if not body.strTitle.strip() or not body.strContent.strip():
        raise HTTPException(status_code=422, detail="Title and content are required")
    if body.strPostType not in POST_TYPES:
        raise HTTPException(status_code=422, detail=f"strPostType must be one of {sorted(POST_TYPES)}")

    community = None
    if body.community_id is not None:
        community = crud_communities.get_community(db, body.community_id)
        if not community:
            raise HTTPException(status_code=404, detail="Community not found")
        if crud_communities.is_banned(db, community.id, current_user.id):
            raise HTTPException(status_code=403, detail="You are banned from this community")
        if not crud_communities.is_active_member(db, community.id, current_user.id):
            raise HTTPException(status_code=403, detail="Join the community before posting into it")

    # Community analysis_default only shapes the DEFAULT when the author didn't
    # choose; an explicit author choice always wins.
    mode = body.strAnalysisMode
    if mode is None:
        mode = "open" if (community is None or community.analysis_default) else "off"
    focus_json = _validate_analysis(mode, body.allowed_analysis_focus)

    content = body.strContent.strip()
    if body.strReferences and body.strReferences.strip():
        content += f"\n\nReferences: {body.strReferences.strip()}"

    post = BlogModel(
        author_id=current_user.id,
        community_id=community.id if community else None,
        strTitle=body.strTitle.strip()[:255],
        strSummary=_derive_summary(content),
        strContent=content,
        strMediaUrl=(body.strMediaUrl or None),
        strPostType=body.strPostType,
        strAnalysisMode=mode,
        jsonAllowedAnalysisFocus=focus_json,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    crud_engagement.award_badge(db, current_user.id, "first_post", "post", post.id)
    return post

@router.patch("/blogs/{blog_id}/", response_model=BlogResponse)
def update_post(blog_id: int, body: PostUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    post = crud_blog.get_blog_by_id(db, blog_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    if post.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only the author can edit this post")

    if body.strPostType is not None and body.strPostType not in POST_TYPES:
        raise HTTPException(status_code=422, detail=f"strPostType must be one of {sorted(POST_TYPES)}")

    if body.strTitle is not None:
        if not body.strTitle.strip():
            raise HTTPException(status_code=422, detail="Title cannot be empty")
        post.strTitle = body.strTitle.strip()[:255]
    if body.strContent is not None:
        if not body.strContent.strip():
            raise HTTPException(status_code=422, detail="Content cannot be empty")
        post.strContent = body.strContent.strip()
        post.strSummary = _derive_summary(post.strContent)
    if body.strMediaUrl is not None:
        post.strMediaUrl = body.strMediaUrl.strip() or None
    if body.strPostType is not None:
        post.strPostType = body.strPostType

    db.commit()
    db.refresh(post)
    return post

@router.patch("/blogs/{blog_id}/analysis-settings/", response_model=BlogResponse)
def update_analysis_settings(blog_id: int, body: AnalysisSettingsUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    post = crud_blog.get_blog_by_id(db, blog_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    if post.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only the author can change analysis settings")
    post.jsonAllowedAnalysisFocus = _validate_analysis(body.strAnalysisMode, body.allowed_analysis_focus)
    post.strAnalysisMode = body.strAnalysisMode
    db.commit()
    db.refresh(post)
    return post

@router.delete("/blogs/{blog_id}")
def delete_post(blog_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    post = crud_blog.get_blog_by_id(db, blog_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    is_owner = post.author_id == current_user.id
    is_community_creator = bool(post.community_id) and crud_communities.is_creator(db, post.community_id, current_user.id)
    if not (is_owner or is_community_creator or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not allowed to remove this post")
    db.delete(post)
    db.commit()
    return {"message": "Post removed"}
