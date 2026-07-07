from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.blog_models import BlogModel, BlogCommentModel
from schemas.blog_schemas import BlogCommentCreate

from sqlalchemy.orm import Session, joinedload
import json
import datetime

def count_all_comments_for_blog(db: Session, blog_id: int):
    """Count all comments including replies for a blog"""
    all_comments = db.query(BlogCommentModel).filter(BlogCommentModel.blog_id == blog_id).all()
    return len(all_comments)

def get_blogs(db: Session, skip: int = 0, limit: int = 100):
    blogs = db.query(BlogModel)\
             .options(joinedload(BlogModel.author), joinedload(BlogModel.community), joinedload(BlogModel.ai_analysis))\
             .offset(skip).limit(limit).all()

    # Update comments_count to include replies
    for blog in blogs:
        blog.comments_count = count_all_comments_for_blog(db, blog.id)

    return blogs

def get_blog_by_id(db: Session, blog_id: int):
    from models.blog_models import BlogContextModel
    blog = db.query(BlogModel).filter(BlogModel.id == blog_id).first()
    if blog:
        # Eagerly load contexts and flatten sources
        blog.contexts = db.query(BlogContextModel).filter(BlogContextModel.blog_id == blog_id).all()
        # Flatten all sources from all contexts into a single list
        all_sources = []
        for context in blog.contexts:
            all_sources.extend(get_context_sources(db, context.id))
        blog.sources = all_sources
    return blog

def get_blog_comments(db: Session, blog_id: int, skip: int = 0, limit: int = 100):
    return db.query(BlogCommentModel).filter(
        BlogCommentModel.blog_id == blog_id,
        BlogCommentModel.parent_comment_id == None
    ).offset(skip).limit(limit).all()

def create_blog_comment(db: Session, blog_id: int, comment: BlogCommentCreate, user_id: int, author_username: str):
    # Identity comes from the authenticated user, never from the request body;
    # strAuthor is a display cache of the username at post time.
    new_comment = BlogCommentModel(
        blog_id=blog_id,
        parent_comment_id=comment.parent_comment_id,
        user_id=user_id,
        strAuthor=author_username,
        strContent=comment.strContent,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

def update_blog_comment(db: Session, comment_id: int, author: str = None, content: str = None):
    comment = db.query(BlogCommentModel).filter(BlogCommentModel.id == comment_id).first()
    if comment:
        if author:
            comment.strAuthor = author
        if content:
            comment.strContent = content
        db.commit()
        db.refresh(comment)
        return comment
    return None

def delete_blog_comment(db: Session, comment_id: int):
    comment = db.query(BlogCommentModel).filter(BlogCommentModel.id == comment_id).first()
    if comment:
        db.delete(comment)
        db.commit()
        return True
    return False

def get_comment_replies(db: Session, comment_id: int, skip: int = 0, limit: int = 100):
    return db.query(BlogCommentModel).filter(BlogCommentModel.parent_comment_id == comment_id).offset(skip).limit(limit).all()

def create_comment_reply(db: Session, blog_id: int, parent_comment_id: int, user_id: int, author: str, content: str):
    reply = BlogCommentModel(blog_id=blog_id, parent_comment_id=parent_comment_id, user_id=user_id, strAuthor=author, strContent=content)
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return reply

def get_comment_analysis(db: Session, comment_id: int):
    from models.blog_models import CommentAnalysisModel
    return db.query(CommentAnalysisModel).filter(CommentAnalysisModel.comment_id == comment_id).first()

def create_or_update_comment_analysis(db: Session, comment_id: int, ai_summary: str = None):
    from models.blog_models import CommentAnalysisModel
    analysis = db.query(CommentAnalysisModel).filter(CommentAnalysisModel.comment_id == comment_id).first()
    if analysis:
        if ai_summary:
            analysis.ai_summary = ai_summary
    else:
        analysis = CommentAnalysisModel(comment_id=comment_id, ai_summary=ai_summary)
        db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis

def delete_comment_analysis(db: Session, comment_id: int):
    from models.blog_models import CommentAnalysisModel
    analysis = db.query(CommentAnalysisModel).filter(CommentAnalysisModel.comment_id == comment_id).first()
    if analysis:
        db.delete(analysis)
        db.commit()
        return True
    return False

def create_audit_collection(db: Session, blog_id: int):
    from models.blog_models import BlogAuditCollectionModel

    blog = get_blog_by_id(db, blog_id)
    if not blog:
        return None

    comments = get_blog_comments(db, blog_id, skip=0, limit=1000)
    contexts = get_blog_contexts(db, blog_id)

    source_ids = []
    for context in contexts:
        sources = get_context_sources(db, context.id)
        source_ids.extend([s.id for s in sources])

    collected_data = {
        "blog": {
            "id": blog.id,
            "strTitle": blog.strTitle,
            "strSummary": blog.strSummary,
            "strContent": blog.strContent,
            "strThemeColor": blog.strThemeColor,
            "datePublished": str(blog.datePublished),
            "numUpvotes": blog.numUpvotes,
            "strAuthorUsername": blog.strAuthorUsername,
            "strCommunityName": blog.strCommunityName
        },
        "contexts": [
            {
                "id": c.id,
                "strTitle": c.strTitle,
                "strDescription": c.strDescription,
                "dtCreatedAt": str(c.dtCreatedAt)
            }
            for c in contexts
        ],
        "sources": [
            {
                "id": s.id,
                "context_id": s.context_id,
                "strTitle": s.strTitle,
                "strUrl": s.strUrl,
                "strAuthor": s.strAuthor,
                "dtCreatedAt": str(s.dtCreatedAt)
            }
            for context in contexts
            for s in get_context_sources(db, context.id)
        ],
        # A count, not the full comment text: the post-audit prompt judges the
        # post's own claim/sources, never reasons about individual comments,
        # so sending their full content here was pure wasted input tokens.
        # Comments get their own dedicated (and much cheaper) analysis path -
        # see analyze_comment_audit / analyze_comment_batch.
        "comment_count": len(comments),
    }

    comment_ids = [c.id for c in comments]

    collection = BlogAuditCollectionModel(
        blog_id=blog_id,
        collected_data=json.dumps(collected_data),
        comment_ids=json.dumps(comment_ids),
        source_ids=json.dumps(source_ids),
        context_ids=json.dumps([c.id for c in contexts]),
        status="pending"
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection

def get_audit_collection(db: Session, collection_id: int):
    from models.blog_models import BlogAuditCollectionModel
    return db.query(BlogAuditCollectionModel).filter(BlogAuditCollectionModel.id == collection_id).first()

def update_audit_collection_response(db: Session, collection_id: int, llm_response: dict):
    from models.blog_models import BlogAuditCollectionModel
    collection = db.query(BlogAuditCollectionModel).filter(BlogAuditCollectionModel.id == collection_id).first()
    if collection:
        collection.llm_response = json.dumps(llm_response)
        collection.status = "processed"
        collection.processed_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(collection)
        return collection
    return None

def sync_audit_to_blog_analysis(db: Session, blog_id: int, llm_response: dict):
    """Sync LLM audit results to BlogAIAnalysisModel."""
    from models.blog_models import BlogAIAnalysisModel

    blog = get_blog_by_id(db, blog_id)
    if not blog:
        return None

    summary = llm_response.get("summary", "")
    context_guardrail = llm_response.get("ai_context_guardrail", "")
    detail = llm_response.get("analysis_detail")
    detail_json = json.dumps(detail) if detail else None

    now = datetime.datetime.utcnow()
    analysis = db.query(BlogAIAnalysisModel).filter(BlogAIAnalysisModel.blog_id == blog_id).first()
    if analysis:
        analysis.ai_summary = summary
        analysis.ai_context_guardrail = context_guardrail
        analysis.analysis_detail = detail_json
        analysis.analyzed_at = now
    else:
        analysis = BlogAIAnalysisModel(
            blog_id=blog_id,
            ai_summary=summary,
            ai_context_guardrail=context_guardrail,
            analysis_detail=detail_json,
            analyzed_at=now,
        )
        db.add(analysis)

    db.commit()
    db.refresh(analysis)
    return analysis


def get_blog_audit_collections(db: Session, blog_id: int):
    from models.blog_models import BlogAuditCollectionModel
    return db.query(BlogAuditCollectionModel).filter(BlogAuditCollectionModel.blog_id == blog_id).all()

# Defensive ceiling on how much comment text we'll ever hand to the LLM in one
# field. Comments are normally short; this only bites on an outlier and keeps
# a single pathological comment from blowing up token cost.
_MAX_COMMENT_CHARS = 2000
_MAX_PARENT_CONTEXT_CHARS = 500


def _blog_context_for_comment_analysis(db: Session, blog):
    """Full context a comment should be judged against: the post's own text,
    its approved community sources (link + title), and its context guardrail
    - so 'is this comment on-topic and does it engage what's already
    established' can actually be judged, not guessed from title/summary alone."""
    return {
        "strTitle": blog.strTitle,
        "strSummary": blog.strSummary,
        "strContent": blog.strContent,
        "ai_summary": blog.ai_summary,
        "ai_context_guardrail": blog.ai_context_guardrail,
        "sources": [
            {"strTitle": s.strTitle, "strUrl": s.strUrl}
            for s in get_blog_sources(db, blog.id, status="approved")
        ],
    }


def get_all_blog_comments_flat(db: Session, blog_id: int):
    """All comments for a blog - top-level AND nested replies - as one flat
    list. Replies carry the same blog_id as their post, so this is one query."""
    return db.query(BlogCommentModel).filter(BlogCommentModel.blog_id == blog_id).all()


def get_comments_needing_analysis(db: Session, blog_id: int):
    """Comments on this blog that don't yet have a CommentAnalysisModel row.
    Skips anything already analyzed so re-running comment analysis doesn't
    re-spend on comments that haven't changed since last time."""
    from models.blog_models import CommentAnalysisModel
    return (
        db.query(BlogCommentModel)
        .outerjoin(CommentAnalysisModel, CommentAnalysisModel.comment_id == BlogCommentModel.id)
        .filter(BlogCommentModel.blog_id == blog_id, CommentAnalysisModel.comment_id.is_(None))
        .all()
    )


def _ancestor_chain(comment, by_id: dict):
    """Walk parent_comment_id links (root first) using an in-memory id->comment
    map, so a whole thread's ancestor chains cost zero extra DB queries."""
    chain = []
    current = comment
    while current and current.parent_comment_id:
        parent = by_id.get(current.parent_comment_id)
        if not parent:
            break
        chain.insert(0, {
            "id": parent.id,
            "strAuthor": parent.strAuthor,
            "strContent": (parent.strContent or "")[:_MAX_PARENT_CONTEXT_CHARS],
        })
        current = parent
    return chain


def create_comment_audit_collection(db: Session, comment_id: int):
    """Collect full context for a single comment: its ancestor tree, the
    post's actual text/sources/guardrail, and the comment itself."""
    from models.blog_models import CommentAuditCollectionModel

    comment = db.query(BlogCommentModel).filter(BlogCommentModel.id == comment_id).first()
    if not comment:
        return None

    blog = get_blog_by_id(db, comment.blog_id)
    if not blog:
        return None

    by_id = {c.id: c for c in get_all_blog_comments_flat(db, comment.blog_id)}

    collected_data = {
        "blog": _blog_context_for_comment_analysis(db, blog),
        "comment_chain": _ancestor_chain(comment, by_id),
        "target_comment": {
            "id": comment.id,
            "strAuthor": comment.strAuthor,
            "strContent": (comment.strContent or "")[:_MAX_COMMENT_CHARS],
            "datePosted": str(comment.datePosted)
        }
    }

    collection = CommentAuditCollectionModel(
        comment_id=comment_id,
        blog_id=comment.blog_id,
        collected_data=json.dumps(collected_data),
        status="pending"
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection


def build_comment_batch_payload(db: Session, blog_id: int):
    """Payload for analyze_comment_batch: shared blog context (text, sources,
    guardrail) once, plus every comment that still needs analysis, each with
    its full ancestor tree if it's a reply. Returns None if there's nothing to
    analyze (no Gemini call needed)."""
    blog = get_blog_by_id(db, blog_id)
    if not blog:
        return None

    pending = get_comments_needing_analysis(db, blog_id)
    blog_context = _blog_context_for_comment_analysis(db, blog)
    if not pending:
        return {"blog": blog_context, "comments": []}

    by_id = {c.id: c for c in get_all_blog_comments_flat(db, blog_id)}
    comments_payload = [
        {
            "id": c.id,
            "strAuthor": c.strAuthor,
            "strContent": (c.strContent or "")[:_MAX_COMMENT_CHARS],
            "parent_chain": _ancestor_chain(c, by_id),
        }
        for c in pending
    ]

    return {"blog": blog_context, "comments": comments_payload}


def get_comment_audit_collection(db: Session, collection_id: int):
    from models.blog_models import CommentAuditCollectionModel
    return db.query(CommentAuditCollectionModel).filter(CommentAuditCollectionModel.id == collection_id).first()

def update_comment_audit_collection_response(db: Session, collection_id: int, llm_response: dict):
    from models.blog_models import CommentAuditCollectionModel
    collection = db.query(CommentAuditCollectionModel).filter(CommentAuditCollectionModel.id == collection_id).first()
    if collection:
        collection.llm_response = json.dumps(llm_response)
        collection.status = "processed"
        collection.processed_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(collection)
        return collection
    return None

def sync_comment_audit_to_analysis(db: Session, comment_id: int, llm_response: dict):
    """Sync LLM comment analysis results to CommentAnalysisModel."""
    from models.blog_models import CommentAnalysisModel

    ai_summary = llm_response.get("ai_summary", "")

    now = datetime.datetime.utcnow()
    analysis = db.query(CommentAnalysisModel).filter(CommentAnalysisModel.comment_id == comment_id).first()
    if analysis:
        analysis.ai_summary = ai_summary
        analysis.analyzed_at = now
    else:
        analysis = CommentAnalysisModel(
            comment_id=comment_id,
            ai_summary=ai_summary,
            analyzed_at=now,
        )
        db.add(analysis)

    db.commit()
    db.refresh(analysis)
    return analysis

def get_recent_contributions(db: Session):
    from models.blog_models import RecentContributionModel, BlogModel
    contributions = db.query(RecentContributionModel)\
        .options(joinedload(RecentContributionModel.blog).joinedload(BlogModel.author),
                 joinedload(RecentContributionModel.blog).joinedload(BlogModel.community),
                 joinedload(RecentContributionModel.blog).joinedload(BlogModel.ai_analysis))\
        .join(BlogModel, RecentContributionModel.blog_id == BlogModel.id)\
        .order_by(RecentContributionModel.position).all()
    return [rc for rc in contributions]

def add_to_recent_contributions(db: Session, blog_id: int, position: int, admin_user_id: int = None):
    from models.blog_models import RecentContributionModel

    # Check if position already taken
    existing = db.query(RecentContributionModel).filter(RecentContributionModel.position == position).first()
    if existing:
        # Remove from that position
        db.delete(existing)
        db.commit()

    contribution = RecentContributionModel(
        blog_id=blog_id,
        position=position,
        added_by_id=admin_user_id
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return contribution

def remove_from_recent_contributions(db: Session, contribution_id: int):
    from models.blog_models import RecentContributionModel
    contribution = db.query(RecentContributionModel).filter(RecentContributionModel.id == contribution_id).first()
    if contribution:
        db.delete(contribution)
        db.commit()
        return True
    return False

def update_contribution_position(db: Session, contribution_id: int, new_position: int):
    from models.blog_models import RecentContributionModel

    # Check if new position already taken
    existing = db.query(RecentContributionModel).filter(RecentContributionModel.position == new_position).first()
    if existing and existing.id != contribution_id:
        db.delete(existing)
        db.commit()

    contribution = db.query(RecentContributionModel).filter(RecentContributionModel.id == contribution_id).first()
    if contribution:
        contribution.position = new_position
        db.commit()
        db.refresh(contribution)
        return contribution
    return None

def get_featured_blogs(db: Session, skip: int = 0, limit: int = 100):
    from models.blog_models import FeaturedBlogModel, BlogModel
    features = db.query(FeaturedBlogModel)\
                 .options(joinedload(FeaturedBlogModel.blog).joinedload(BlogModel.author),
                          joinedload(FeaturedBlogModel.blog).joinedload(BlogModel.community),
                          joinedload(FeaturedBlogModel.blog).joinedload(BlogModel.ai_analysis))\
                 .offset(skip).limit(limit).all()
    # return the actual BlogModel objects mapped from the FeaturedBlogModel relationship
    return [f.blog for f in features if f.blog]

def add_featured_blog(db: Session, blog_id: int):
    from models.blog_models import FeaturedBlogModel
    existing = db.query(FeaturedBlogModel).filter(FeaturedBlogModel.blog_id == blog_id).first()
    if not existing:
        new_feature = FeaturedBlogModel(blog_id=blog_id)
        db.add(new_feature)
        db.commit()
        db.refresh(new_feature)
        return new_feature
    return existing

def remove_featured_blog(db: Session, blog_id: int):
    from models.blog_models import FeaturedBlogModel
    existing = db.query(FeaturedBlogModel).filter(FeaturedBlogModel.blog_id == blog_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return True
    return False

def toggle_reaction(db: Session, blog_id: int, user_id: int, emoji: str):
    from models.blog_models import PostReactionModel
    existing = db.query(PostReactionModel).filter(
        PostReactionModel.post_id == blog_id,
        PostReactionModel.user_id == user_id,
        PostReactionModel.emoji == emoji
    ).first()
    
    if existing:
        try:
            db.delete(existing)
            db.commit()
        except Exception:
            db.rollback()
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail="Failed to remove reaction")
        return {"status": "removed"}
    else:
        count = db.query(PostReactionModel).filter(
            PostReactionModel.post_id == blog_id,
            PostReactionModel.user_id == user_id
        ).count()
        if count >= 3:
            return {"status": "error", "message": "Maximum 3 reactions allowed per post"}
        
        new_reaction = PostReactionModel(post_id=blog_id, user_id=user_id, emoji=emoji)
        db.add(new_reaction)
        try:
            db.commit()
        except IntegrityError:
            # Concurrent duplicate blocked by uq_reaction_post_user_emoji: the
            # reaction already exists, which is the state the caller wanted.
            db.rollback()
        return {"status": "added"}

def get_post_reactions(db: Session, blog_id: int):
    from models.blog_models import PostReactionModel
    from sqlalchemy import func
    
    reactions = db.query(
        PostReactionModel.emoji, 
        func.count(PostReactionModel.id).label('count')
    ).filter(PostReactionModel.post_id == blog_id).group_by(PostReactionModel.emoji).all()
    
    return {r.emoji: r.count for r in reactions}

def get_user_reactions(db: Session, blog_id: int, user_id: int):
    from models.blog_models import PostReactionModel
    reactions = db.query(PostReactionModel.emoji).filter(
        PostReactionModel.post_id == blog_id,
        PostReactionModel.user_id == user_id
    ).all()
    return [r.emoji for r in reactions]

def get_blog_contexts(db: Session, blog_id: int):
    from models.blog_models import BlogContextModel
    return db.query(BlogContextModel).filter(BlogContextModel.blog_id == blog_id).all()

def create_blog_context(db: Session, blog_id: int, title: str, description: str = None):
    from models.blog_models import BlogContextModel
    context = BlogContextModel(blog_id=blog_id, strTitle=title, strDescription=description)
    db.add(context)
    db.commit()
    db.refresh(context)
    return context

def update_blog_context(db: Session, context_id: int, title: str = None, description: str = None):
    from models.blog_models import BlogContextModel
    context = db.query(BlogContextModel).filter(BlogContextModel.id == context_id).first()
    if context:
        if title:
            context.strTitle = title
        if description is not None:
            context.strDescription = description
        db.commit()
        db.refresh(context)
        return context
    return None

def delete_blog_context(db: Session, context_id: int):
    from models.blog_models import BlogContextModel
    context = db.query(BlogContextModel).filter(BlogContextModel.id == context_id).first()
    if context:
        db.delete(context)
        db.commit()
        return True
    return False

def get_context_sources(db: Session, context_id: int):
    from models.blog_models import BlogSourceModel
    return db.query(BlogSourceModel).filter(BlogSourceModel.context_id == context_id).all()

def get_or_create_default_context(db: Session, blog_id: int):
    from models.blog_models import BlogContextModel
    context = db.query(BlogContextModel).filter(BlogContextModel.blog_id == blog_id).first()
    if context:
        return context
    context = BlogContextModel(blog_id=blog_id, strTitle="General")
    db.add(context)
    db.commit()
    db.refresh(context)
    return context

def get_blog_sources(db: Session, blog_id: int, status: str = None):
    from models.blog_models import BlogSourceModel, BlogContextModel
    query = (
        db.query(BlogSourceModel)
        .join(BlogContextModel, BlogSourceModel.context_id == BlogContextModel.id)
        .filter(BlogContextModel.blog_id == blog_id)
    )
    if status:
        query = query.filter(BlogSourceModel.review_status == status)
    return query.order_by(BlogSourceModel.dtCreatedAt.desc()).all()

def create_source_for_blog(db: Session, blog_id: int, title: str, url: str, description: str = None, author: str = None):
    context = get_or_create_default_context(db, blog_id)
    return create_source_in_context(db, context.id, title, url, description, author)

def create_source_in_context(db: Session, context_id: int, title: str, url: str, description: str = None, author: str = None):
    from models.blog_models import BlogSourceModel
    source = BlogSourceModel(context_id=context_id, strTitle=title, strUrl=url, strDescription=description, strAuthor=author)
    db.add(source)
    db.commit()
    db.refresh(source)
    return source

def update_blog_source(db: Session, source_id: int, title: str = None, url: str = None, author: str = None):
    from models.blog_models import BlogSourceModel
    source = db.query(BlogSourceModel).filter(BlogSourceModel.id == source_id).first()
    if source:
        if title:
            source.strTitle = title
        if url:
            source.strUrl = url
        if author is not None:
            source.strAuthor = author
        db.commit()
        db.refresh(source)
        return source
    return None

def approve_blog_source(db: Session, source_id: int, approved_by: str = "admin", approver_name: str = None):
    from models.blog_models import BlogSourceModel
    source = db.query(BlogSourceModel).filter(BlogSourceModel.id == source_id).first()
    if source:
        source.review_status = "approved"
        source.approved_by = approved_by
        source.approver_name = approver_name
        db.commit()
        db.refresh(source)
        return source
    return None

def delete_blog_source(db: Session, source_id: int):
    from models.blog_models import BlogSourceModel
    source = db.query(BlogSourceModel).filter(BlogSourceModel.id == source_id).first()
    if source:
        db.delete(source)
        db.commit()
        return True
    return False
