"""Report/flag a post or comment for moderator review, and the admin queue
to resolve reports. Separate router file: routers/verisphere.py is over the
file-size cap.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.user_models import UserModel
from models.blog_models import ReportModel, BlogModel, BlogCommentModel
from core.deps import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/api/verisphere/reports", tags=["Reports"])

CONTENT_TYPES = {"post", "comment"}
REASON_MAX_LENGTH = 300


class ReportCreate(BaseModel):
    content_type: str
    content_id: int
    reason: str


class ReportResolve(BaseModel):
    action: str  # 'dismiss' | 'remove_content'


def _find_content(db: Session, content_type: str, content_id: int):
    if content_type == "post":
        return db.query(BlogModel).filter(BlogModel.id == content_id).first()
    return db.query(BlogCommentModel).filter(BlogCommentModel.id == content_id).first()


@router.post("/")
def create_report(body: ReportCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    if body.content_type not in CONTENT_TYPES:
        raise HTTPException(status_code=422, detail="content_type must be 'post' or 'comment'")

    reason = body.reason.strip()
    if not reason:
        raise HTTPException(status_code=422, detail="A reason is required")
    if len(reason) > REASON_MAX_LENGTH:
        raise HTTPException(status_code=422, detail=f"Reason is limited to {REASON_MAX_LENGTH} characters")

    if not _find_content(db, body.content_type, body.content_id):
        raise HTTPException(status_code=404, detail="Reported content not found")

    # One open report per user per content item - resubmitting isn't spam,
    # it's a no-op that confirms the existing report.
    duplicate = db.query(ReportModel).filter(
        ReportModel.content_type == body.content_type,
        ReportModel.content_id == body.content_id,
        ReportModel.reporter_id == current_user.id,
        ReportModel.status == "open",
    ).first()
    if duplicate:
        return {"message": "You've already reported this - a moderator will review it."}

    report = ReportModel(
        content_type=body.content_type, content_id=body.content_id,
        reporter_id=current_user.id, reason=reason,
    )
    db.add(report)
    db.commit()
    return {"message": "Report submitted. A moderator will review it."}


@router.get("/")
def list_open_reports(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    reports = db.query(ReportModel).filter(ReportModel.status == "open").order_by(ReportModel.created_at.desc()).all()
    result = []
    for r in reports:
        content = _find_content(db, r.content_type, r.content_id)
        if content is None:
            preview = "[content already deleted]"
        elif r.content_type == "post":
            preview = content.strTitle
        else:
            preview = content.strContent[:150]
        result.append({
            "id": r.id,
            "content_type": r.content_type,
            "content_id": r.content_id,
            "reason": r.reason,
            "reporter_username": r.reporter.username if r.reporter else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "content_preview": preview,
        })
    return result


@router.post("/{report_id}/resolve")
def resolve_report(report_id: int, body: ReportResolve, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin_user)):
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "open":
        raise HTTPException(status_code=400, detail="Report already resolved")
    if body.action not in {"dismiss", "remove_content"}:
        raise HTTPException(status_code=422, detail="action must be 'dismiss' or 'remove_content'")

    if body.action == "remove_content":
        content = _find_content(db, report.content_type, report.content_id)
        if content is not None:
            db.delete(content)
        report.status = "removed"
    else:
        report.status = "dismissed"

    report.resolved_at = datetime.utcnow()
    report.resolved_by_id = current_user.id
    db.commit()
    return {"message": "Report resolved"}
