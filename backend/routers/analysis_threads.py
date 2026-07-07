"""Analysis-as-comment endpoint (design doc sections 5-7).

Separate router file: routers/verisphere.py is over the size cap.
"""
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from crud import crud_blog, crud_analysis, crud_engagement
from services import llm_thread_analysis
from services.llm_audit import LlmAuditError, _MODEL_NAME
from core.config import settings
from core.deps import get_current_active_user
from models.user_models import UserModel
from schemas.blog_schemas import BlogCommentResponse

router = APIRouter(prefix="/api/verisphere", tags=["Analysis threads"])

DAILY_REQUEST_LIMIT = 5
_FOCUS_OPTIONS = {"fact_check", "sources", "logic", "clarity", "react_in_kind"}
_DEPTH_OPTIONS = {"quick", "deep"}
_TONE_OPTIONS = {"match", "formal"}
_CUSTOM_INSTRUCTION_MAX = 300

class AnalysisRequestCreate(BaseModel):
    focus: Optional[str] = "fact_check"
    depth: Optional[str] = "quick"
    tone: Optional[str] = "match"
    custom_instruction: Optional[str] = ""

class AnalysisThreadResponse(BaseModel):
    request: BlogCommentResponse
    response: Optional[BlogCommentResponse] = None
    deduplicated: bool = False

def _validate_params(body: AnalysisRequestCreate) -> str:
    if body.focus not in _FOCUS_OPTIONS:
        raise HTTPException(status_code=422, detail=f"focus must be one of {sorted(_FOCUS_OPTIONS)}")
    if body.depth not in _DEPTH_OPTIONS:
        raise HTTPException(status_code=422, detail=f"depth must be one of {sorted(_DEPTH_OPTIONS)}")
    if body.tone not in _TONE_OPTIONS:
        raise HTTPException(status_code=422, detail=f"tone must be one of {sorted(_TONE_OPTIONS)}")
    instruction = (body.custom_instruction or "").strip()
    if len(instruction) > _CUSTOM_INSTRUCTION_MAX:
        raise HTTPException(status_code=422, detail=f"custom_instruction is limited to {_CUSTOM_INSTRUCTION_MAX} characters")
    return crud_analysis.normalize_params(body.dict())

@router.post("/blogs/{blog_id}/analysis-requests/", response_model=AnalysisThreadResponse)
def create_analysis_thread(blog_id: int, body: AnalysisRequestCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    blog = crud_blog.get_blog_by_id(db, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    # Author analysis consent (design doc section 4): off blocks entirely;
    # limited restricts to the author-allowed lenses.
    if blog.strAnalysisMode == "off":
        raise HTTPException(status_code=403, detail="The author has not opened this post to analysis.")
    if blog.strAnalysisMode == "limited":
        allowed = set(json.loads(blog.jsonAllowedAnalysisFocus or "[]"))
        if body.focus not in allowed:
            raise HTTPException(status_code=403, detail=f"The author opened this post to these lenses only: {sorted(allowed)}")

    params_json = _validate_params(body)

    duplicate = crud_analysis.find_duplicate_request(db, blog_id, params_json)
    if duplicate:
        return {"request": duplicate, "response": None, "deduplicated": True}

    if crud_analysis.count_requests_today(db, current_user.id) >= DAILY_REQUEST_LIMIT:
        raise HTTPException(status_code=429, detail=f"Analysis request limit reached ({DAILY_REQUEST_LIMIT} per day). Try again tomorrow.")

    request = crud_analysis.create_analysis_request(db, blog_id, current_user, params_json)
    try:
        collection = crud_blog.create_audit_collection(db, blog_id)
        result = llm_thread_analysis.analyze_post_thread(
            json.loads(collection.collected_data), json.loads(params_json)
        )
    except LlmAuditError as e:
        # No orphaned requests: if the model call fails, the thread never happened.
        crud_analysis.delete_comment_row(db, request.id)
        raise HTTPException(status_code=503, detail=str(e))

    model_used = "mock" if settings.USE_MOCK_LLM else _MODEL_NAME
    response = crud_analysis.create_analysis_response(db, blog_id, request.id, result, model_used)

    # Post author hears about it; reputation coupling is positive-only
    # (retention reanalysis section 3.6): a favorable read credits the author,
    # an unfavorable one only ever speaks in the thread text.
    crud_engagement.notify_engagement(
        db, blog.author_id, current_user, "analysis_on_post",
        blog_id=blog_id, ref_table="comment", ref_id=response.id,
    )
    if result.get("assessment") == "supported" and blog.author_id and blog.author_id != current_user.id:
        crud_engagement.record_reputation_event(
            db, blog.author_id, current_user.id, "analysis_favorable", 2, "comment", response.id,
        )
        crud_engagement.award_badge(db, blog.author_id, "well_sourced", "comment", response.id)
    crud_engagement.award_badge(db, current_user.id, "curious_mind", "comment", request.id)

    return {"request": request, "response": response, "deduplicated": False}
