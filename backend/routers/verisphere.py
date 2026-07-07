import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from crud import crud_blog, crud_portfolio, crud_engagement, crud_analysis
from services import llm_audit
from schemas.blog_schemas import BlogResponse, BlogCommentResponse, BlogCommentCreate, BlogSourceResponse, BlogSourceCreate, CommentAnalysisResponse, CommentAnalysisCreate, BlogContextResponse, BlogContextCreate, BlogAuditCollectionResponse
from pydantic import BaseModel as PydanticBaseModel

class RecentContributionPositionRequest(PydanticBaseModel):
    blog_id: int
    position: int
from schemas.portfolio_schemas import VideoResponse

router = APIRouter(prefix="/api/verisphere", tags=["Verisphere"])

# Shared cap across comment-analyze and post-analyze - both spend real Gemini
# tokens and are now open to any logged-in user, not just admins.
ANALYZE_DAILY_LIMIT = 5

from core.deps import get_current_admin_user, get_current_active_user, get_current_user_optional
from models.user_models import UserModel

@router.get("/blogs/featured/", response_model=List[BlogResponse])
def get_featured_blogs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_blog.get_featured_blogs(db, skip=skip, limit=limit)

@router.post("/blogs/featured/{blog_id}")
def add_featured_blog(blog_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    crud_blog.add_featured_blog(db, blog_id)
    return {"message": "Blog featured successfully"}

@router.delete("/blogs/featured/{blog_id}")
def remove_featured_blog(blog_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    crud_blog.remove_featured_blog(db, blog_id)
    return {"message": "Blog removed from featured list"}

@router.get("/blogs/", response_model=List[BlogResponse])
def get_blogs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    blogs = crud_blog.get_blogs(db, skip=skip, limit=limit)
    featured_blogs = crud_blog.get_featured_blogs(db, skip=0, limit=1000)
    featured_ids = {b.id for b in featured_blogs}
    
    for blog in blogs:
        blog.boolIsFeatured = blog.id in featured_ids
        
    return blogs

@router.get("/blogs/{blog_id}/comments/", response_model=List[BlogCommentResponse])
def get_blog_comments(blog_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return crud_blog.get_blog_comments(db, blog_id, skip=skip, limit=limit)

@router.post("/blogs/{blog_id}/comments/", response_model=BlogCommentResponse)
def post_blog_comment(blog_id: int, comment: BlogCommentCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    _require_not_banned(db, blog, current_user)
    new_comment = crud_blog.create_blog_comment(db, blog_id, comment, user_id=current_user.id, author_username=current_user.username)
    crud_engagement.notify_engagement(
        db, blog.author_id, current_user, "comment_on_post",
        blog_id=blog_id, ref_table="comment", ref_id=new_comment.id,
    )
    return new_comment

def _require_comment_owner_or_admin(db: Session, comment_id: int, current_user: UserModel):
    """Owner, admin, or (for moderation) the creator of the post's community."""
    from models.blog_models import BlogCommentModel
    from crud import crud_communities
    comment = db.query(BlogCommentModel).filter(BlogCommentModel.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    is_owner = comment.user_id is not None and comment.user_id == current_user.id
    is_community_creator = bool(
        comment.blog and comment.blog.community_id
        and crud_communities.is_creator(db, comment.blog.community_id, current_user.id)
    )
    if not is_owner and not is_community_creator and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not allowed to modify this comment")
    return comment

def _require_not_banned(db: Session, blog, current_user: UserModel):
    """Community bans block writing (posts and comments) in that community only."""
    from crud import crud_communities
    if blog.community_id and crud_communities.is_banned(db, blog.community_id, current_user.id):
        raise HTTPException(status_code=403, detail="You are banned from this community")

@router.put("/blogs/{blog_id}/comments/{comment_id}", response_model=BlogCommentResponse)
def update_blog_comment(blog_id: int, comment_id: int, comment: BlogCommentCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    _require_comment_owner_or_admin(db, comment_id, current_user)
    updated = crud_blog.update_blog_comment(db, comment_id, content=comment.strContent)
    if not updated:
        raise HTTPException(status_code=404, detail="Comment not found")
    return updated

@router.delete("/blogs/{blog_id}/comments/{comment_id}")
def delete_blog_comment(blog_id: int, comment_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    _require_comment_owner_or_admin(db, comment_id, current_user)
    success = crud_blog.delete_blog_comment(db, comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}

@router.get("/videos/", response_model=List[VideoResponse])
def get_videos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_portfolio.get_videos(db, skip=skip, limit=limit)

from pydantic import BaseModel
class ReactionRequest(BaseModel):
    # Identity comes from the auth token, never the body.
    emoji: str

@router.post("/blogs/{blog_id}/react")
def toggle_reaction(blog_id: int, req: ReactionRequest, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    result = crud_blog.toggle_reaction(db, blog_id, current_user.id, req.emoji)
    if result.get("status") in ("added", "removed"):
        blog = crud_blog.get_blog_by_id(db, blog_id)
        # Added: +1 reputation and a notification. Removed: compensating -1 ledger
        # entry only (notify_engagement suppresses reaction_removed notifications).
        crud_engagement.notify_engagement(
            db, blog.author_id if blog else None, current_user,
            "reaction_received" if result["status"] == "added" else "reaction_removed",
            blog_id=blog_id, ref_table="post", ref_id=blog_id,
            reputation_weight=1 if result["status"] == "added" else -1,
        )
    return result

@router.get("/blogs/{blog_id}/reactions")
def get_reactions(blog_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user_optional)):
    all_reactions = crud_blog.get_post_reactions(db, blog_id)
    user_reactions = crud_blog.get_user_reactions(db, blog_id, current_user.id) if current_user else []
    return {"reactions": all_reactions, "user_reacted": {emoji: True for emoji in user_reactions}}

@router.get("/blogs/{blog_id}/contexts/", response_model=List[BlogContextResponse])
def get_contexts(blog_id: int, db: Session = Depends(get_db)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return crud_blog.get_blog_contexts(db, blog_id)

@router.post("/blogs/{blog_id}/contexts/", response_model=BlogContextResponse)
def add_context(blog_id: int, context: BlogContextCreate, db: Session = Depends(get_db)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return crud_blog.create_blog_context(db, blog_id, context.strTitle, context.strDescription)

@router.put("/blogs/{blog_id}/contexts/{context_id}", response_model=BlogContextResponse)
def update_context(blog_id: int, context_id: int, context: BlogContextCreate, db: Session = Depends(get_db)):
    updated = crud_blog.update_blog_context(db, context_id, context.strTitle, context.strDescription)
    if not updated:
        raise HTTPException(status_code=404, detail="Context not found")
    return updated

@router.delete("/blogs/{blog_id}/contexts/{context_id}")
def delete_context(blog_id: int, context_id: int, db: Session = Depends(get_db)):
    success = crud_blog.delete_blog_context(db, context_id)
    if not success:
        raise HTTPException(status_code=404, detail="Context not found")
    return {"message": "Context deleted successfully"}

@router.get("/contexts/{context_id}/sources/", response_model=List[BlogSourceResponse])
def get_sources(context_id: int, db: Session = Depends(get_db)):
    return crud_blog.get_context_sources(db, context_id)

@router.post("/contexts/{context_id}/sources/", response_model=BlogSourceResponse)
def add_source(context_id: int, source: BlogSourceCreate, db: Session = Depends(get_db)):
    return crud_blog.create_source_in_context(db, context_id, source.strTitle, source.strUrl, source.strDescription, source.strAuthor)

@router.get("/blogs/{blog_id}/sources/", response_model=List[BlogSourceResponse])
def get_blog_sources(blog_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return crud_blog.get_blog_sources(db, blog_id, status=status)

@router.post("/blogs/{blog_id}/sources/", response_model=BlogSourceResponse)
def add_blog_source(blog_id: int, source: BlogSourceCreate, db: Session = Depends(get_db)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return crud_blog.create_source_for_blog(db, blog_id, source.strTitle, source.strUrl, source.strDescription, source.strAuthor)

@router.put("/sources/{source_id}", response_model=BlogSourceResponse)
def update_source(source_id: int, source: BlogSourceCreate, db: Session = Depends(get_db)):
    updated = crud_blog.update_blog_source(db, source_id, source.strTitle, source.strUrl, source.strAuthor)
    if not updated:
        raise HTTPException(status_code=404, detail="Source not found")
    return updated

@router.post("/sources/{source_id}/approve/", response_model=BlogSourceResponse)
def approve_source(source_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    updated = crud_blog.approve_blog_source(db, source_id, approved_by="admin", approver_name=current_user.username)
    if not updated:
        raise HTTPException(status_code=404, detail="Source not found")
    return updated

@router.delete("/sources/{source_id}")
def delete_source(source_id: int, db: Session = Depends(get_db)):
    success = crud_blog.delete_blog_source(db, source_id)
    if not success:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"message": "Source deleted successfully"}

@router.get("/recent-contributions/", response_model=List[BlogResponse])
def get_recent_contributions(db: Session = Depends(get_db)):
    contributions = crud_blog.get_recent_contributions(db)
    return [c.blog for c in contributions if c.blog]

@router.post("/recent-contributions/")
def add_recent_contribution(req: RecentContributionPositionRequest, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    contribution = crud_blog.add_to_recent_contributions(db, req.blog_id, req.position, current_user.id)
    return {"id": contribution.id, "blog_id": contribution.blog_id, "position": contribution.position}

@router.put("/recent-contributions/{contribution_id}/position/")
def update_contribution_position(contribution_id: int, position: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    updated = crud_blog.update_contribution_position(db, contribution_id, position)
    if not updated:
        raise HTTPException(status_code=404, detail="Contribution not found")
    return {"id": updated.id, "blog_id": updated.blog_id, "position": updated.position}

@router.delete("/recent-contributions/{contribution_id}/")
def delete_recent_contribution(contribution_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    success = crud_blog.remove_from_recent_contributions(db, contribution_id)
    if not success:
        raise HTTPException(status_code=404, detail="Contribution not found")
    return {"message": "Contribution removed successfully"}

@router.post("/blogs/{blog_id}/audit/collect/", response_model=BlogAuditCollectionResponse)
def collect_audit_data(blog_id: int, db: Session = Depends(get_db)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    collection = crud_blog.create_audit_collection(db, blog_id)
    if not collection:
        raise HTTPException(status_code=400, detail="Failed to create collection")
    return collection

@router.post("/blogs/{blog_id}/audit/run/", response_model=BlogAuditCollectionResponse)
def run_blog_audit(blog_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    """Collect a blog's data, send it to Gemini, store the result, and
    auto-approve any pending sources the model recommends (approved_by="ai")."""
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    collection = crud_blog.create_audit_collection(db, blog_id)
    if not collection:
        raise HTTPException(status_code=400, detail="Failed to create collection")

    try:
        llm_result = llm_audit.analyze_audit_collection(json.loads(collection.collected_data))
    except llm_audit.LlmAuditError as e:
        raise HTTPException(status_code=503, detail=str(e))

    collection = crud_blog.update_audit_collection_response(db, collection.id, llm_result)

    # Sync LLM results to BlogAIAnalysisModel
    crud_blog.sync_audit_to_blog_analysis(db, blog_id, llm_result)

    for source_id in llm_result.get("approved_source_ids", []):
        crud_blog.approve_blog_source(db, source_id, approved_by="ai", approver_name=llm_audit.APPROVER_DISPLAY_NAME)

    return collection

@router.get("/audit/collections/{collection_id}/", response_model=BlogAuditCollectionResponse)
def get_audit_collection(collection_id: int, db: Session = Depends(get_db)):
    collection = crud_blog.get_audit_collection(db, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection

@router.get("/blogs/{blog_id}/audit/collections/", response_model=List[BlogAuditCollectionResponse])
def get_blog_audit_collections(blog_id: int, db: Session = Depends(get_db)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return crud_blog.get_blog_audit_collections(db, blog_id)

@router.post("/audit/collections/{collection_id}/llm-response/")
def set_llm_response(collection_id: int, llm_response: dict, db: Session = Depends(get_db)):
    """For a manually-supplied llm_response (e.g. an external caller that ran
    its own model). POST /blogs/{blog_id}/audit/run/ is the endpoint that
    actually calls Gemini itself; this one just records + applies whatever
    response is handed to it, in the same shape llm_audit.analyze_audit_collection
    returns."""
    collection = crud_blog.update_audit_collection_response(db, collection_id, llm_response)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    for source_id in llm_response.get("approved_source_ids", []):
        crud_blog.approve_blog_source(db, source_id, approved_by="ai", approver_name=llm_audit.APPROVER_DISPLAY_NAME)
    return {"message": "LLM response stored", "status": collection.status}

@router.get("/blogs/{blog_id}/comments/{comment_id}/replies/", response_model=List[BlogCommentResponse])
def get_replies(blog_id: int, comment_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    comment = crud_blog.get_blog_by_id(db, blog_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Blog not found")
    return crud_blog.get_comment_replies(db, comment_id, skip=skip, limit=limit)

@router.post("/blogs/{blog_id}/comments/{comment_id}/replies/", response_model=BlogCommentResponse)
def add_reply(blog_id: int, comment_id: int, reply: BlogCommentCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    _require_not_banned(db, blog, current_user)
    new_reply = crud_blog.create_comment_reply(db, blog_id, comment_id, current_user.id, current_user.username, reply.strContent)
    from models.blog_models import BlogCommentModel
    parent = db.query(BlogCommentModel).filter(BlogCommentModel.id == comment_id).first()
    crud_engagement.notify_engagement(
        db, parent.user_id if parent else None, current_user, "reply_to_comment",
        blog_id=blog_id, ref_table="comment", ref_id=new_reply.id,
    )
    return new_reply

@router.get("/comments/{comment_id}/analysis/", response_model=CommentAnalysisResponse)
def get_comment_analysis(comment_id: int, db: Session = Depends(get_db)):
    analysis = crud_blog.get_comment_analysis(db, comment_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@router.post("/comments/{comment_id}/analysis/", response_model=CommentAnalysisResponse)
def create_comment_analysis(comment_id: int, analysis: CommentAnalysisCreate, db: Session = Depends(get_db)):
    return crud_blog.create_or_update_comment_analysis(db, comment_id, analysis.ai_summary)

@router.post("/comments/{comment_id}/analyze/", response_model=CommentAnalysisResponse)
def analyze_comment_endpoint(comment_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    """Trigger audit/analysis of a blog comment using full context.

    Open to any logged-in user (was admin-only) - gated instead by the
    shared ANALYZE_DAILY_LIMIT below since each call spends real Gemini tokens.
    """
    from models.blog_models import BlogCommentModel
    comment = db.query(BlogCommentModel).filter(BlogCommentModel.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if crud_analysis.count_analyze_actions_today(db, current_user.id) >= ANALYZE_DAILY_LIMIT:
        raise HTTPException(status_code=429, detail=f"Analysis limit reached ({ANALYZE_DAILY_LIMIT} per day). Try again tomorrow.")

    collection = crud_blog.create_comment_audit_collection(db, comment_id)
    if not collection:
        raise HTTPException(status_code=400, detail="Failed to create collection")

    try:
        llm_result = llm_audit.analyze_comment_audit(json.loads(collection.collected_data))
    except llm_audit.LlmAuditError as e:
        raise HTTPException(status_code=503, detail=str(e))

    collection = crud_blog.update_comment_audit_collection_response(db, collection.id, llm_result)

    # Sync LLM results to CommentAnalysisModel
    analysis = crud_blog.sync_comment_audit_to_analysis(db, comment_id, llm_result)
    crud_analysis.log_analyze_action(db, current_user.id)

    return analysis

@router.delete("/comments/{comment_id}/analysis/")
def delete_comment_analysis(comment_id: int, db: Session = Depends(get_db)):
    success = crud_blog.delete_comment_analysis(db, comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"message": "Analysis deleted successfully"}

@router.post("/blogs/{blog_id}/comments/analyze-batch/")
def analyze_comments_batch(blog_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    """Analyze every not-yet-analyzed comment on this blog in ONE Gemini call
    instead of one call per comment - see analyze_comment_batch. Comments that
    already have an analysis are skipped, so re-running this doesn't re-spend
    on unchanged comments. Returns {"analyzed": []} with no Gemini call at all
    if everything is already analyzed."""
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    batch = crud_blog.build_comment_batch_payload(db, blog_id)
    if not batch or not batch["comments"]:
        return {"analyzed": []}

    try:
        llm_result = llm_audit.analyze_comment_batch(batch)
    except llm_audit.LlmAuditError as e:
        raise HTTPException(status_code=503, detail=str(e))

    analyzed = []
    for item in llm_result.get("results", []):
        comment_id = item.get("comment_id")
        if comment_id is None:
            continue
        analysis = crud_blog.sync_comment_audit_to_analysis(db, comment_id, item)
        analyzed.append({
            "comment_id": comment_id,
            "ai_summary": analysis.ai_summary,
            "analyzed_at": analysis.analyzed_at.isoformat() if analysis.analyzed_at else None,
        })

    return {"analyzed": analyzed}

@router.post("/blogs/{blog_id}/analysis/", response_model=BlogResponse)
def analyze_blog(blog_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    """Trigger audit/analysis of a blog post and return updated blog with analysis.

    Open to any logged-in user (was admin-only) - gated instead by the
    shared ANALYZE_DAILY_LIMIT below since each call spends real Gemini tokens.
    """
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    if crud_analysis.count_analyze_actions_today(db, current_user.id) >= ANALYZE_DAILY_LIMIT:
        raise HTTPException(status_code=429, detail=f"Analysis limit reached ({ANALYZE_DAILY_LIMIT} per day). Try again tomorrow.")

    collection = crud_blog.create_audit_collection(db, blog_id)
    if not collection:
        raise HTTPException(status_code=400, detail="Failed to create collection")

    try:
        llm_result = llm_audit.analyze_audit_collection(json.loads(collection.collected_data))
    except llm_audit.LlmAuditError as e:
        raise HTTPException(status_code=503, detail=str(e))

    collection = crud_blog.update_audit_collection_response(db, collection.id, llm_result)

    # Sync LLM results to BlogAIAnalysisModel
    crud_blog.sync_audit_to_blog_analysis(db, blog_id, llm_result)

    for source_id in llm_result.get("approved_source_ids", []):
        crud_blog.approve_blog_source(db, source_id, approved_by="ai", approver_name=llm_audit.APPROVER_DISPLAY_NAME)

    crud_analysis.log_analyze_action(db, current_user.id)

    # Return updated blog with analysis
    return crud_blog.get_blog_by_id(db, blog_id)
