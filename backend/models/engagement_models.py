from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Index, UniqueConstraint
from database import Base
import datetime

class CommunityMemberModel(Base):
    """Membership makes a community a place (third-place principle): the same
    people, in the same named space, repeatedly. Creator role carries the
    moderation tools; banned status blocks posting/commenting there only."""
    __tablename__ = "community_members"
    __table_args__ = (UniqueConstraint("community_id", "user_id", name="uq_member_community_user"),)

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("blog_communitymodel.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False, default="member")     # creator | member
    status = Column(String(20), nullable=False, default="active")   # active | banned
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

class UserBadgeModel(Base):
    """Positive-only recognition (reanalysis section 3.3). Definitions live in
    code; a badge signals, it never empowers. Unique per (user, badge)."""
    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_slug", name="uq_badge_user_slug"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_slug = Column(String(50), nullable=False)
    community_id = Column(Integer, nullable=True)
    ref_table = Column(String(50), nullable=True)
    ref_id = Column(Integer, nullable=True)
    awarded_at = Column(DateTime, default=datetime.datetime.utcnow)

class ReputationEventModel(Base):
    """Append-only reputation ledger.

    The displayed score is always SUM(weight) over a user's rows - never a mutable
    column. Reversals (e.g. a reaction being removed) append a compensating negative
    event rather than deleting history, so the ledger stays auditable and weights can
    be re-tuned by recomputation. Reputation is recognition only: nothing may read it
    to grant power over other users' content (see retention reanalysis doc, section 3.2).
    """
    __tablename__ = "user_reputationeventmodel"

    id = Column(Integer, primary_key=True, index=True)
    # Recipient of the reputation change.
    user_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="CASCADE"), nullable=False, index=True)
    # Who caused it (null for system-generated events, or if that account is deleted).
    actor_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(50), nullable=False)
    weight = Column(Integer, nullable=False)
    # Loose reference to the object that earned it (post, comment, ...).
    ref_table = Column(String(50), nullable=True)
    ref_id = Column(Integer, nullable=True)
    # Reserved for community-scoped credibility (phase 4); global events leave it null.
    community_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class NotificationModel(Base):
    """One row per user-facing notification; read state is a timestamp."""
    __tablename__ = "user_notificationmodel"
    __table_args__ = (Index("ix_notification_user_read", "user_id", "read_at"),)

    id = Column(Integer, primary_key=True, index=True)
    # Recipient.
    user_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)
    # Display cache of the acting user's name at event time (same pattern as
    # BlogCommentModel.strAuthor) - avoids a join just to render a row.
    actor_username = Column(String(255), nullable=True)
    # Deep-link target: the post whose comments page shows the event.
    blog_id = Column(Integer, nullable=True)
    ref_table = Column(String(50), nullable=True)
    ref_id = Column(Integer, nullable=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
