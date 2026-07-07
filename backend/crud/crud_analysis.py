"""CRUD for the analysis-as-comment flow (design doc section 5-6)."""
import json
import datetime
from sqlalchemy.orm import Session
from models.blog_models import BlogCommentModel
from models.user_models import UserModel
from services.llm_audit import SYNAPSE_AI_USERNAME, APPROVER_DISPLAY_NAME

def normalize_params(params: dict) -> str:
    """Canonical JSON for dedupe comparison - sorted keys, defaults applied."""
    return json.dumps({
        "focus": params.get("focus") or "fact_check",
        "depth": params.get("depth") or "quick",
        "tone": params.get("tone") or "match",
        "custom_instruction": (params.get("custom_instruction") or "").strip(),
    }, sort_keys=True)

def count_requests_today(db: Session, user_id: int) -> int:
    # The comment table itself is the rate-limit counter - no separate quota table.
    since = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    return (
        db.query(BlogCommentModel)
        .filter(
            BlogCommentModel.user_id == user_id,
            BlogCommentModel.strType == "analysis_request",
            BlogCommentModel.datePosted >= since,
        )
        .count()
    )

def find_duplicate_request(db: Session, blog_id: int, params_json: str):
    """An identical request on the same post surfaces the existing thread
    instead of re-spending tokens (design doc section 9)."""
    return (
        db.query(BlogCommentModel)
        .filter(
            BlogCommentModel.blog_id == blog_id,
            BlogCommentModel.strType == "analysis_request",
            BlogCommentModel.jsonAnalysisParams == params_json,
        )
        .first()
    )

def create_analysis_request(db: Session, blog_id: int, user, params_json: str):
    params = json.loads(params_json)
    focus = params["focus"].replace("_", " ")
    request = BlogCommentModel(
        blog_id=blog_id,
        user_id=user.id,
        strAuthor=user.username,
        strType="analysis_request",
        jsonAnalysisParams=params_json,
        strContent=f"Requested an AI analysis ({focus}, {params['depth']}).",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

def create_analysis_response(db: Session, blog_id: int, parent_id: int, result: dict, model_used: str):
    # Attribute to the platform's real AI account when it exists so the reply is
    # owned like any other comment; display name stays "Synapse AI" either way.
    ai_user = db.query(UserModel).filter(UserModel.username == SYNAPSE_AI_USERNAME).first()
    response = BlogCommentModel(
        blog_id=blog_id,
        parent_comment_id=parent_id,
        user_id=ai_user.id if ai_user else None,
        strAuthor=APPROVER_DISPLAY_NAME,
        strType="analysis_response",
        strContent=result.get("response_text", ""),
        jsonAnalysisResult=json.dumps(result),
        strModelUsed=model_used,
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return response

def delete_comment_row(db: Session, comment_id: int):
    """Remove an orphaned analysis_request after an LLM failure."""
    row = db.query(BlogCommentModel).filter(BlogCommentModel.id == comment_id).first()
    if row:
        db.delete(row)
        db.commit()

def count_analyze_actions_today(db: Session, user_id: int) -> int:
    """Shared daily cap for the plain 'Analyze'/'Analyze Post' buttons - a
    separate quota from count_requests_today, which only covers the
    analysis-as-comment thread flow."""
    from models.user_models import AnalysisUsageModel
    since = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    return (
        db.query(AnalysisUsageModel)
        .filter(AnalysisUsageModel.user_id == user_id, AnalysisUsageModel.created_at >= since)
        .count()
    )

def log_analyze_action(db: Session, user_id: int):
    from models.user_models import AnalysisUsageModel
    db.add(AnalysisUsageModel(user_id=user_id))
    db.commit()
