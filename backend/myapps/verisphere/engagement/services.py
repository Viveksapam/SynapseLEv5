import datetime
import logging

from django.db import IntegrityError, transaction
from django.db.models import Case, Count, Sum, When
from django.utils import timezone

from myapps.verisphere.engagement.models import NotificationModel, ReputationEventModel, UserBadgeModel

logger = logging.getLogger("django")


_NOTIFY_PREF_FIELD = {
    "comment_on_post": "notify_replies",
    "reply_to_comment": "notify_replies",
    "reaction_received": "notify_reactions",
    "analysis_on_post": "notify_analysis",
}


def record_reputation_event(user_id: int, actor_id, event_type: str, weight: int, ref_table: str = None, ref_id: int = None):
    return ReputationEventModel.objects.create(
        user_id=user_id, actor_id=actor_id, event_type=event_type,
        weight=weight, ref_table=ref_table, ref_id=ref_id,
    )


def get_reputation_summary(user_id: int):
    rows = (
        ReputationEventModel.objects.filter(user_id=user_id)
        .values("event_type").annotate(total=Sum("weight"))
    )
    by_type = {row["event_type"]: int(row["total"] or 0) for row in rows}
    return {"total": sum(by_type.values()), "by_type": by_type}


def create_notification(user_id: int, type: str, actor_username: str = None, blog_id: int = None, ref_table: str = None, ref_id: int = None):
    return NotificationModel.objects.create(
        user_id=user_id, type=type, actor_username=actor_username,
        blog_id=blog_id, ref_table=ref_table, ref_id=ref_id,
    )


def get_notifications(user_id: int, limit: int = 30):
    return list(
        NotificationModel.objects.filter(user_id=user_id).order_by("-created_at", "-id")[:limit]
    )


def get_unread_count(user_id: int) -> int:
    return NotificationModel.objects.filter(user_id=user_id, read_at__isnull=True).count()


def mark_all_read(user_id: int) -> int:
    return NotificationModel.objects.filter(user_id=user_id, read_at__isnull=True).update(
        read_at=timezone.now()
    )


def notify_engagement(recipient_id, actor, type: str, blog_id: int = None, ref_table: str = None, ref_id: int = None, reputation_weight: int = 0):
    if recipient_id is None or actor is None or recipient_id == actor.id:
        return
    try:






        with transaction.atomic():
            if reputation_weight:
                record_reputation_event(recipient_id, actor.id, type, reputation_weight, ref_table, ref_id)
            if type != "reaction_removed" and _recipient_wants(recipient_id, type):
                create_notification(recipient_id, type, actor.username, blog_id, ref_table, ref_id)
    except Exception as exc:
        logger.warning("engagement bookkeeping failed (%s): %s", type, exc)


def _recipient_wants(recipient_id: int, type: str) -> bool:
    field = _NOTIFY_PREF_FIELD.get(type)
    if not field:
        return True
    from myapps.users.models import UserModel
    recipient = UserModel.objects.filter(id=recipient_id).first()
    return bool(recipient) and getattr(recipient, field, True)


def award_badge(user_id: int, badge_slug: str, ref_table: str = None, ref_id: int = None, community_id: int = None):
    try:

        with transaction.atomic():
            UserBadgeModel.objects.create(user_id=user_id, badge_slug=badge_slug, ref_table=ref_table, ref_id=ref_id, community_id=community_id)
    except IntegrityError:
        pass
    except Exception as exc:
        logger.warning("badge award failed (%s): %s", badge_slug, exc)


def get_badges(user_id: int):
    return list(UserBadgeModel.objects.filter(user_id=user_id).order_by("awarded_at"))


def get_recap(user_id: int, days: int = 30) -> dict:
    from myapps.verisphere.comments.models import BlogCommentModel
    from myapps.verisphere.posts.models import BlogModel

    since = timezone.now() - datetime.timedelta(days=days)
    reputation = (
        ReputationEventModel.objects.filter(user_id=user_id, created_at__gte=since)
        .aggregate(total=Sum("weight"))["total"] or 0
    )
    posts = BlogModel.objects.filter(author_id=user_id, datePublished__gte=since.date()).count()
    comment_counts = BlogCommentModel.objects.filter(user_id=user_id, datePosted__gte=since).aggregate(
        comments=Count(Case(When(strType="standard", then=1))),
        analyses=Count(Case(When(strType="analysis_request", then=1))),
    )
    return {"days": days, "reputation_earned": int(reputation), "posts": posts,
            "comments": comment_counts["comments"], "analyses_requested": comment_counts["analyses"]}
