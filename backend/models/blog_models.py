from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Float, BigInteger, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime
from models.user_models import UserModel

class CommunityModel(Base):
    __tablename__ = "blog_communitymodel"

    id = Column(Integer, primary_key=True, index=True)
    strName = Column(String(255), nullable=False)
    strDescription = Column(Text, nullable=True)
    # Two-register architecture (retention reanalysis section 2): lounge spaces
    # optimize for low-pressure interaction, library spaces for rigor. The register
    # sets defaults (like whether the analysis affordance shows) - it never gates
    # what members may say.
    register = Column(String(20), nullable=False, default="library")
    analysis_default = Column(Boolean, nullable=False, default=True)
    created_by = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="SET NULL"), nullable=True)
    dtCreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    @property
    def member_count(self):
        from sqlalchemy.orm import object_session
        from models.engagement_models import CommunityMemberModel
        session = object_session(self)
        if not session:
            return 0
        return (
            session.query(CommunityMemberModel)
            .filter(CommunityMemberModel.community_id == self.id,
                    CommunityMemberModel.status == "active")
            .count()
        )

class BlogModel(Base):
    __tablename__ = "blog_blogmodel"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="SET NULL"), nullable=True)
    community_id = Column(Integer, ForeignKey("blog_communitymodel.id", ondelete="SET NULL"), nullable=True)
    strTitle = Column(String(255))
    strSummary = Column(Text)
    strContent = Column(Text)
    strThemeColor = Column(String(50), default="#4f46e5")
    datePublished = Column(Date, default=datetime.date.today)
    strMediaUrl = Column(String(500), nullable=True)
    strCategory = Column(String(50), nullable=True)
    numReadTime = Column(Integer, nullable=True)
    numUpvotes = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    # Author-declared intent (design doc section 4): a strong prior for the
    # analysis two-dials classification and a small badge in the UI.
    strPostType = Column(String(20), nullable=False, default="mixed")
    # The author's analysis consent: open | limited | off. Consent is revocable
    # after publishing - being analyzed unwillingly is what drives authors away.
    strAnalysisMode = Column(String(20), nullable=False, default="open")
    # When mode is 'limited': JSON list of allowed focus lenses.
    jsonAllowedAnalysisFocus = Column(Text, nullable=True)

    author = relationship("UserModel")
    community = relationship("CommunityModel")
    comments = relationship("BlogCommentModel", back_populates="blog")
    ai_analysis = relationship("BlogAIAnalysisModel", back_populates="blog", uselist=False)
    @property
    def strAuthorUsername(self):
        return self.author.username if self.author else 'System'

    @property
    def objCommunity(self):
        return self.community_id

    @property
    def strCommunityName(self):
        return self.community.strName if self.community else 'General'

    @property
    def strCommunityRegister(self):
        return self.community.register if self.community else 'library'

    @property
    def ai_summary(self):
        return self.ai_analysis.ai_summary if self.ai_analysis else None

    @property
    def ai_context_guardrail(self):
        return self.ai_analysis.ai_context_guardrail if self.ai_analysis else None

    @property
    def analyzed_at(self):
        return self.ai_analysis.analyzed_at if self.ai_analysis else None

    @property
    def analysis_detail(self):
        import json as _json
        raw = self.ai_analysis.analysis_detail if self.ai_analysis else None
        if not raw:
            return None
        try:
            return _json.loads(raw)
        except (ValueError, TypeError):
            return None

    @property
    def boolAnalysisEnabled(self):
        # The post row is the single source of truth for analysis consent. The
        # community's analysis_default only shapes the COMPOSER default at
        # creation time (see routers/posts.py); after that, author choice rules.
        return self.strAnalysisMode != "off"

    @property
    def sources_count(self):
        # Total sources across all contexts, regardless of review_status -
        # Community Sources only shows approved ones, but the feed count
        # reflects everything submitted.
        from sqlalchemy.orm import object_session
        from models.blog_models import BlogContextModel, BlogSourceModel
        session = object_session(self)
        if not session:
            return 0
        return (
            session.query(BlogSourceModel)
            .join(BlogContextModel, BlogSourceModel.context_id == BlogContextModel.id)
            .filter(BlogContextModel.blog_id == self.id)
            .count()
        )

class BlogAIAnalysisModel(Base):
    __tablename__ = "blog_blogaianalysismodel"

    blog_id = Column(Integer, ForeignKey("blog_blogmodel.id", ondelete="CASCADE"), primary_key=True)
    ai_summary = Column(Text, nullable=True)
    # The epistemic frame for the discussion: established ground truth + where
    # this thread is at risk of drifting from it. Distinct from ai_summary,
    # which audits the specific post. Powers the "Context Guardrails" panel.
    ai_context_guardrail = Column(Text, nullable=True)
    # JSON blob holding the decomposed audit: sub_scores, detected_fallacies,
    # steelman, verification_pathway. Kept as text so the rubric can evolve
    # without a migration per field.
    analysis_detail = Column(Text, nullable=True)
    # When this analysis was last (re)generated.
    analyzed_at = Column(DateTime, nullable=True)

    blog = relationship("BlogModel", back_populates="ai_analysis")

class BlogCommentModel(Base):
    __tablename__ = "blog_blogcommentmodel"

    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, ForeignKey("blog_blogmodel.id", ondelete="CASCADE"))
    parent_comment_id = Column(Integer, ForeignKey("blog_blogcommentmodel.id", ondelete="CASCADE"), nullable=True, index=True)
    # Identity spine: authenticated author. Nullable for legacy anonymous rows;
    # SET NULL keeps the comment (with strAuthor as display cache) if the user is deleted.
    user_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="SET NULL"), nullable=True, index=True)
    # Denormalized display cache of the author's username at post time (same
    # pattern as BlogModel.comments_count). Source of truth for identity is user_id.
    strAuthor = Column(String(255), default="Anonymous")
    strContent = Column(Text)
    # Analysis-as-comment (design doc section 5): 'standard' | 'analysis_request'
    # | 'analysis_response'. Requests carry their params; responses carry the
    # structured LLM output. The requester is simply the request row's author.
    strType = Column(String(30), nullable=False, default="standard", index=True)
    jsonAnalysisParams = Column(Text, nullable=True)
    jsonAnalysisResult = Column(Text, nullable=True)
    strModelUsed = Column(String(100), nullable=True)
    datePosted = Column(DateTime, default=datetime.datetime.utcnow)

    blog = relationship("BlogModel", back_populates="comments")
    user = relationship("UserModel", foreign_keys="[BlogCommentModel.user_id]", passive_deletes=True)
    analysis = relationship("CommentAnalysisModel", back_populates="comment", uselist=False, passive_deletes=True)

    @property
    def strAiAnalysis(self):
        return self.analysis.ai_summary if self.analysis else None

    @property
    def dictAiMetrics(self):
        if not self.analysis:
            return None
        return {
            'analyzed_at': self.analysis.analyzed_at.isoformat() if self.analysis.analyzed_at else None,
        }

class CommentAnalysisModel(Base):
    __tablename__ = "blog_commentanalysismodel"

    comment_id = Column(Integer, ForeignKey("blog_blogcommentmodel.id", ondelete="CASCADE"), primary_key=True)
    ai_summary = Column(Text, nullable=True)
    # When this comment analysis was last (re)generated.
    analyzed_at = Column(DateTime, nullable=True)

    comment = relationship("BlogCommentModel", back_populates="analysis")

class FeaturedBlogModel(Base):
    __tablename__ = "blog_featuredblogmodel"

    blog_id = Column(Integer, ForeignKey("blog_blogmodel.id", ondelete="CASCADE"), primary_key=True)
    blog = relationship("BlogModel")

class PostReactionModel(Base):
    __tablename__ = "blog_postreactionmodel"
    # One row per (post, user, emoji): toggle logic depends on uniqueness, and
    # reaction counts feed the future reputation ledger so must not be inflatable.
    __table_args__ = (UniqueConstraint("post_id", "user_id", "emoji", name="uq_reaction_post_user_emoji"),)

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("blog_blogmodel.id", ondelete="CASCADE"), index=True)
    user_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="CASCADE"), index=True)
    emoji = Column(String(50), index=True)

    post = relationship("BlogModel", passive_deletes=True)
    user = relationship("UserModel", foreign_keys="[PostReactionModel.user_id]", passive_deletes=True)

class BlogContextModel(Base):
    __tablename__ = "blog_blogcontextmodel"

    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, ForeignKey("blog_blogmodel.id", ondelete="CASCADE"), index=True)
    strTitle = Column(String(255))
    strDescription = Column(Text, nullable=True)
    dtCreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    blog = relationship("BlogModel")
    sources = relationship("BlogSourceModel", back_populates="context")

class BlogSourceModel(Base):
    __tablename__ = "blog_blogsourcemodel"

    id = Column(Integer, primary_key=True, index=True)
    context_id = Column(Integer, ForeignKey("blog_blogcontextmodel.id", ondelete="CASCADE"), index=True)
    # Text, not String(255): AI-recommended sources store a full APA reference
    # here (author, year, title, publisher, URL), which routinely exceeds 255 chars.
    strTitle = Column(Text)
    strUrl = Column(String(500))
    strDescription = Column(Text, nullable=True)
    strAuthor = Column(String(255), nullable=True)
    review_status = Column(String(20), default='pending', nullable=False)
    # Role of approver: 'admin', 'moderator', or 'ai'. Null while pending.
    approved_by = Column(String(20), nullable=True)
    # Human username or AI model name (e.g. 'vivek' or 'Gemini 2.0 Flash').
    approver_name = Column(String(100), nullable=True)
    dtCreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    context = relationship("BlogContextModel", back_populates="sources")

class RecentContributionModel(Base):
    __tablename__ = "blog_recentcontributionmodel"

    id = Column(Integer, primary_key=True, index=True)
    # Independent of Featured status - a blog can be pinned to the homepage
    # "Recent Contributions" slots without being in blog_featuredblogmodel.
    blog_id = Column(Integer, ForeignKey("blog_blogmodel.id", ondelete="CASCADE"), index=True)
    position = Column(Integer, unique=True)  # 1, 2, 3 for top 3
    added_at = Column(DateTime, default=datetime.datetime.utcnow)
    added_by_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="SET NULL"), nullable=True)

    blog = relationship("BlogModel")

class BlogAuditCollectionModel(Base):
    __tablename__ = "blog_auditcollectionmodel"

    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, ForeignKey("blog_blogmodel.id", ondelete="CASCADE"), index=True)

    comment_ids = Column(Text)
    source_ids = Column(Text)
    context_ids = Column(Text)

    collected_data = Column(Text)
    llm_response = Column(Text, nullable=True)

    status = Column(String(50), default="pending")
    error_message = Column(Text, nullable=True)
    collected_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    blog = relationship("BlogModel")

class CommentAuditCollectionModel(Base):
    __tablename__ = "blog_commentauditcollectionmodel"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("blog_blogcommentmodel.id", ondelete="CASCADE"), index=True)
    blog_id = Column(Integer, ForeignKey("blog_blogmodel.id", ondelete="CASCADE"), index=True)

    collected_data = Column(Text)  # JSON with comment context, parent chain, blog, guardrails
    llm_response = Column(Text, nullable=True)

    status = Column(String(50), default="pending")
    error_message = Column(Text, nullable=True)
    collected_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    comment = relationship("BlogCommentModel")
    blog = relationship("BlogModel")

class ReportModel(Base):
    """A user flagging a post or comment for moderator review.

    content_id is polymorphic (points into blog_blogmodel or
    blog_blogcommentmodel depending on content_type) so it's a plain
    indexed integer, not a real FK - the target table varies per row.
    """
    __tablename__ = "blog_reportmodel"

    id = Column(Integer, primary_key=True, index=True)
    content_type = Column(String(20), nullable=False)  # 'post' | 'comment'
    content_id = Column(Integer, nullable=False, index=True)
    reporter_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(500), nullable=False)
    status = Column(String(20), nullable=False, default="open", index=True)  # open | dismissed | removed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(BigInteger, ForeignKey("user_usermodel.id", ondelete="SET NULL"), nullable=True)

    reporter = relationship("UserModel", foreign_keys=[reporter_id])
    resolved_by = relationship("UserModel", foreign_keys=[resolved_by_id])
