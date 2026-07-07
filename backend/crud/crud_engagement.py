import datetime
import logging
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.engagement_models import ReputationEventModel, NotificationModel, UserBadgeModel

logger = logging.getLogger("uvicorn")

# Which preference flag governs each notification type.
_NOTIFY_PREF_FIELD = {
    "comment_on_post": "notify_replies",
    "reply_to_comment": "notify_replies",
    "reaction_received": "notify_reactions",
    "analysis_on_post": "notify_analysis",
}

def record_reputation_event(db: Session, user_id: int, actor_id, event_type: str, weight: int, ref_table: str = None, ref_id: int = None):
    event = ReputationEventModel(
        user_id=user_id, actor_id=actor_id, event_type=event_type,
        weight=weight, ref_table=ref_table, ref_id=ref_id,
    )
    db.add(event)
    db.commit()
    return event

def get_reputation_summary(db: Session, user_id: int):
    rows = (
        db.query(ReputationEventModel.event_type, func.coalesce(func.sum(ReputationEventModel.weight), 0))
        .filter(ReputationEventModel.user_id == user_id)
        .group_by(ReputationEventModel.event_type)
        .all()
    )
    by_type = {event_type: int(total) for event_type, total in rows}
    return {"total": sum(by_type.values()), "by_type": by_type}

def create_notification(db: Session, user_id: int, type: str, actor_username: str = None, blog_id: int = None, ref_table: str = None, ref_id: int = None):
    notification = NotificationModel(
        user_id=user_id, type=type, actor_username=actor_username,
        blog_id=blog_id, ref_table=ref_table, ref_id=ref_id,
    )
    db.add(notification)
    db.commit()
    return notification

def get_notifications(db: Session, user_id: int, limit: int = 30):
    return (
        db.query(NotificationModel)
        .filter(NotificationModel.user_id == user_id)
        .order_by(NotificationModel.created_at.desc(), NotificationModel.id.desc())
        .limit(limit)
        .all()
    )

def get_unread_count(db: Session, user_id: int):
    return (
        db.query(NotificationModel)
        .filter(NotificationModel.user_id == user_id, NotificationModel.read_at == None)
        .count()
    )

def mark_all_read(db: Session, user_id: int):
    updated = (
        db.query(NotificationModel)
        .filter(NotificationModel.user_id == user_id, NotificationModel.read_at == None)
        .update({NotificationModel.read_at: datetime.datetime.utcnow()}, synchronize_session=False)
    )
    db.commit()
    return updated

def notify_engagement(db: Session, recipient_id, actor, type: str, blog_id: int = None, ref_table: str = None, ref_id: int = None, reputation_weight: int = 0):
    """Best-effort notification + optional reputation event for one engagement.

    Encapsulates the two platform rules: self-actions never notify or earn
    reputation, and engagement bookkeeping must never break the user action that
    triggered it (log and swallow failures).
    """
    if recipient_id is None or actor is None or recipient_id == actor.id:
        return
    try:
        if reputation_weight:
            record_reputation_event(db, recipient_id, actor.id, type, reputation_weight, ref_table, ref_id)
        if type != "reaction_removed" and _recipient_wants(db, recipient_id, type):
            create_notification(db, recipient_id, type, actor.username, blog_id, ref_table, ref_id)
    except Exception as exc:
        db.rollback()
        logger.warning("engagement bookkeeping failed (%s): %s", type, exc)

def _recipient_wants(db: Session, recipient_id: int, type: str) -> bool:
    """Notification preferences suppress the notification only - reputation
    events above are already recorded regardless."""
    field = _NOTIFY_PREF_FIELD.get(type)
    if not field:
        return True
    from models.user_models import UserModel
    recipient = db.query(UserModel).filter(UserModel.id == recipient_id).first()
    return bool(recipient) and getattr(recipient, field, True)

def award_badge(db: Session, user_id: int, badge_slug: str, ref_table: str = None, ref_id: int = None, community_id: int = None):
    """Idempotent, best-effort badge award (unique per user+slug)."""
    try:
        db.add(UserBadgeModel(user_id=user_id, badge_slug=badge_slug, ref_table=ref_table, ref_id=ref_id, community_id=community_id))
        db.commit()
    except IntegrityError:
        db.rollback()
    except Exception as exc:
        db.rollback()
        logger.warning("badge award failed (%s): %s", badge_slug, exc)

def get_badges(db: Session, user_id: int):
    return (
        db.query(UserBadgeModel)
        .filter(UserBadgeModel.user_id == user_id)
        .order_by(UserBadgeModel.awarded_at)
        .all()
    )

def get_recap(db: Session, user_id: int, days: int = 30) -> dict:
    from models.blog_models import BlogModel, BlogCommentModel
    since = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    reputation = (
        db.query(func.coalesce(func.sum(ReputationEventModel.weight), 0))
        .filter(ReputationEventModel.user_id == user_id, ReputationEventModel.created_at >= since)
        .scalar()
    )
    posts = db.query(BlogModel).filter(BlogModel.author_id == user_id, BlogModel.datePublished >= since.date()).count()
    comments = db.query(BlogCommentModel).filter(
        BlogCommentModel.user_id == user_id, BlogCommentModel.datePosted >= since,
        BlogCommentModel.strType == "standard").count()
    analyses = db.query(BlogCommentModel).filter(
        BlogCommentModel.user_id == user_id, BlogCommentModel.datePosted >= since,
        BlogCommentModel.strType == "analysis_request").count()
    return {"days": days, "reputation_earned": int(reputation), "posts": posts,
            "comments": comments, "analyses_requested": analyses}
