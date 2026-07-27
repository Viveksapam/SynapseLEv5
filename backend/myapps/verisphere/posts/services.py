import json

from django.db import IntegrityError
from django.db.models import Count
from django.utils import timezone

from myapps.verisphere.comments.models import BlogCommentModel
from myapps.verisphere.posts.models import (
    BlogAIAnalysisModel,
    BlogAuditCollectionModel,
    BlogModel,
    FeaturedBlogModel,
    PostReactionModel,
    RecentContributionModel,
)

_LIST_SELECT_RELATED = ("author", "community", "community__created_by", "ai_analysis")


def count_all_comments_for_blog(blog_id: int) -> int:
    return BlogCommentModel.objects.filter(blog_id=blog_id).count()


def get_blogs(skip: int = 0, limit: int = 100):
    blogs = list(BlogModel.objects.select_related(*_LIST_SELECT_RELATED)[skip:skip + limit])
    for blog in blogs:
        blog.comments_count = count_all_comments_for_blog(blog.id)
    return blogs


def get_blog_by_id(blog_id: int):
    return BlogModel.objects.select_related(*_LIST_SELECT_RELATED).filter(id=blog_id).first()


def get_recent_contributions():
    return list(
        RecentContributionModel.objects
        .select_related("blog", "blog__author", "blog__community", "blog__ai_analysis")
        .order_by("position")
    )


def add_to_recent_contributions(blog_id: int, position: int, admin_user_id: int = None):
    RecentContributionModel.objects.filter(position=position).delete()
    return RecentContributionModel.objects.create(blog_id=blog_id, position=position, added_by_id=admin_user_id)


def remove_from_recent_contributions(contribution_id: int) -> bool:
    deleted, _ = RecentContributionModel.objects.filter(id=contribution_id).delete()
    return deleted > 0


def update_contribution_position(contribution_id: int, new_position: int):
    RecentContributionModel.objects.filter(position=new_position).exclude(id=contribution_id).delete()
    contribution = RecentContributionModel.objects.filter(id=contribution_id).first()
    if not contribution:
        return None
    contribution.position = new_position
    contribution.save()
    return contribution


def get_featured_blogs(skip: int = 0, limit: int = 100):
    features = (
        FeaturedBlogModel.objects
        .select_related("blog", "blog__author", "blog__community", "blog__ai_analysis")
        [skip:skip + limit]
    )
    return [f.blog for f in features if f.blog_id]


def add_featured_blog(blog_id: int):
    existing = FeaturedBlogModel.objects.filter(blog_id=blog_id).first()
    if existing:
        return existing
    return FeaturedBlogModel.objects.create(blog_id=blog_id)


def remove_featured_blog(blog_id: int) -> bool:
    deleted, _ = FeaturedBlogModel.objects.filter(blog_id=blog_id).delete()
    return deleted > 0


def toggle_reaction(blog_id: int, user_id: int, emoji: str):
    existing = PostReactionModel.objects.filter(post_id=blog_id, user_id=user_id, emoji=emoji).first()
    if existing:
        existing.delete()
        return {"status": "removed"}

    count = PostReactionModel.objects.filter(post_id=blog_id, user_id=user_id).count()
    if count >= 3:
        return {"status": "error", "message": "Maximum 3 reactions allowed per post"}

    try:
        PostReactionModel.objects.create(post_id=blog_id, user_id=user_id, emoji=emoji)
    except IntegrityError:
        pass
    return {"status": "added"}


def get_post_reactions(blog_id: int):
    rows = (
        PostReactionModel.objects.filter(post_id=blog_id)
        .values("emoji").annotate(count=Count("id"))
    )
    return {r["emoji"]: r["count"] for r in rows}


def get_user_reactions(blog_id: int, user_id: int):
    return list(
        PostReactionModel.objects.filter(post_id=blog_id, user_id=user_id).values_list("emoji", flat=True)
    )


def create_audit_collection(blog_id: int):
    from myapps.verisphere.comments.services import get_blog_comments
    from myapps.verisphere.sources.services import get_blog_contexts, get_context_sources

    blog = get_blog_by_id(blog_id)
    if not blog:
        return None

    comments = get_blog_comments(blog_id, skip=0, limit=1000)
    contexts = get_blog_contexts(blog_id)

    source_ids = []
    for context in contexts:
        sources = get_context_sources(context.id)
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
            "strCommunityName": blog.strCommunityName,
        },
        "contexts": [
            {"id": c.id, "strTitle": c.strTitle, "strDescription": c.strDescription, "dtCreatedAt": str(c.dtCreatedAt)}
            for c in contexts
        ],
        "sources": [
            {"id": s.id, "context_id": s.context_id, "strTitle": s.strTitle, "strUrl": s.strUrl,
             "strAuthor": s.strAuthor, "dtCreatedAt": str(s.dtCreatedAt)}
            for context in contexts
            for s in get_context_sources(context.id)
        ],
        "comment_count": len(comments),
    }

    comment_ids = [c.id for c in comments]

    return BlogAuditCollectionModel.objects.create(
        blog_id=blog_id,
        collected_data=json.dumps(collected_data),
        comment_ids=json.dumps(comment_ids),
        source_ids=json.dumps(source_ids),
        context_ids=json.dumps([c.id for c in contexts]),
        status="pending",
    )


def get_audit_collection(collection_id: int):
    return BlogAuditCollectionModel.objects.filter(id=collection_id).first()


def update_audit_collection_response(collection_id: int, llm_response: dict):
    collection = BlogAuditCollectionModel.objects.filter(id=collection_id).first()
    if not collection:
        return None
    collection.llm_response = json.dumps(llm_response)
    collection.status = "processed"
    collection.processed_at = timezone.now()
    collection.save()
    return collection


def sync_audit_to_blog_analysis(blog_id: int, llm_response: dict):
    blog = get_blog_by_id(blog_id)
    if not blog:
        return None

    summary = llm_response.get("summary", "")
    context_guardrail = llm_response.get("ai_context_guardrail", "")
    detail = llm_response.get("analysis_detail")
    detail_json = json.dumps(detail) if detail else None
    now = timezone.now()

    analysis, created = BlogAIAnalysisModel.objects.update_or_create(
        blog_id=blog_id,
        defaults={
            "ai_summary": summary, "ai_context_guardrail": context_guardrail,
            "analysis_detail": detail_json, "analyzed_at": now,
        },
    )
    return analysis


def get_blog_audit_collections(blog_id: int):
    return list(BlogAuditCollectionModel.objects.filter(blog_id=blog_id))
