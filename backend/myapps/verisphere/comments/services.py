import datetime

from django.utils import timezone

from myapps.verisphere.comments.models import BlogCommentModel, CommentAnalysisModel, CommentAuditCollectionModel

SYNAPSE_AI_USERNAME = "synapse_ai"
APPROVER_DISPLAY_NAME = "Synapse AI"

_MAX_COMMENT_CHARS = 2000
_MAX_PARENT_CONTEXT_CHARS = 500


def get_blog_comments(blog_id: int, skip: int = 0, limit: int = 100):
    return list(
        BlogCommentModel.objects.filter(blog_id=blog_id, parent_comment__isnull=True)[skip:skip + limit]
    )


def create_blog_comment(blog_id: int, comment, user_id: int, author_username: str):
    return BlogCommentModel.objects.create(
        blog_id=blog_id, parent_comment_id=comment.get("parent_comment_id"),
        user_id=user_id, strAuthor=author_username, strContent=comment["strContent"],
    )


def update_blog_comment(comment_id: int, author: str = None, content: str = None):
    comment = BlogCommentModel.objects.filter(id=comment_id).first()
    if not comment:
        return None
    if author:
        comment.strAuthor = author
    if content:
        comment.strContent = content
    comment.save()
    return comment


def delete_blog_comment(comment_id: int) -> bool:
    deleted, _ = BlogCommentModel.objects.filter(id=comment_id).delete()
    return deleted > 0


def get_comment_replies(comment_id: int, skip: int = 0, limit: int = 100):
    return list(BlogCommentModel.objects.filter(parent_comment_id=comment_id)[skip:skip + limit])


def create_comment_reply(blog_id: int, parent_comment_id: int, user_id: int, author: str, content: str):
    return BlogCommentModel.objects.create(
        blog_id=blog_id, parent_comment_id=parent_comment_id,
        user_id=user_id, strAuthor=author, strContent=content,
    )


def get_comment_analysis(comment_id: int):
    return CommentAnalysisModel.objects.filter(comment_id=comment_id).first()


def get_all_blog_comments_flat(blog_id: int):
    return list(BlogCommentModel.objects.filter(blog_id=blog_id))


def get_comments_needing_analysis(blog_id: int):
    return list(
        BlogCommentModel.objects.filter(blog_id=blog_id, analysis__isnull=True)
    )


def delete_comment_row(comment_id: int):
    BlogCommentModel.objects.filter(id=comment_id).delete()


def _blog_context_for_comment_analysis(blog):
    from myapps.verisphere.sources.services import get_blog_sources

    return {
        "strTitle": blog.strTitle,
        "strSummary": blog.strSummary,
        "strContent": blog.strContent,
        "ai_summary": blog.ai_summary,
        "ai_context_guardrail": blog.ai_context_guardrail,
        "sources": [
            {"strTitle": s.strTitle, "strUrl": s.strUrl}
            for s in get_blog_sources(blog.id, status="approved")
        ],
    }


def _ancestor_chain(comment, by_id: dict):
    chain = []
    current = comment
    while current and current.parent_comment_id:
        parent = by_id.get(current.parent_comment_id)
        if not parent:
            break
        chain.insert(0, {
            "id": parent.id, "strAuthor": parent.strAuthor,
            "strContent": (parent.strContent or "")[:_MAX_PARENT_CONTEXT_CHARS],
        })
        current = parent
    return chain


def create_comment_audit_collection(comment_id: int):
    from myapps.verisphere.posts.services import get_blog_by_id

    comment = BlogCommentModel.objects.filter(id=comment_id).first()
    if not comment:
        return None

    blog = get_blog_by_id(comment.blog_id)
    if not blog:
        return None

    by_id = {c.id: c for c in get_all_blog_comments_flat(comment.blog_id)}

    collected_data = {
        "blog": _blog_context_for_comment_analysis(blog),
        "comment_chain": _ancestor_chain(comment, by_id),
        "target_comment": {
            "id": comment.id, "strAuthor": comment.strAuthor,
            "strContent": (comment.strContent or "")[:_MAX_COMMENT_CHARS],
            "datePosted": str(comment.datePosted),
        },
    }

    return CommentAuditCollectionModel.objects.create(
        comment_id=comment_id, blog_id=comment.blog_id,
        collected_data=collected_data, status="pending",
    )


def build_comment_batch_payload(blog_id: int):
    from myapps.verisphere.posts.services import get_blog_by_id

    blog = get_blog_by_id(blog_id)
    if not blog:
        return None

    pending = get_comments_needing_analysis(blog_id)
    blog_context = _blog_context_for_comment_analysis(blog)
    if not pending:
        return {"blog": blog_context, "comments": []}

    by_id = {c.id: c for c in get_all_blog_comments_flat(blog_id)}
    comments_payload = [
        {
            "id": c.id, "strAuthor": c.strAuthor,
            "strContent": (c.strContent or "")[:_MAX_COMMENT_CHARS],
            "parent_chain": _ancestor_chain(c, by_id),
        }
        for c in pending
    ]
    return {"blog": blog_context, "comments": comments_payload}


def get_comment_audit_collection(collection_id: int):
    return CommentAuditCollectionModel.objects.filter(id=collection_id).first()


def update_comment_audit_collection_response(collection_id: int, llm_response: dict):
    collection = CommentAuditCollectionModel.objects.filter(id=collection_id).first()
    if not collection:
        return None
    collection.llm_response = llm_response
    collection.status = "processed"
    collection.processed_at = timezone.now()
    collection.save()
    return collection


def sync_comment_audit_to_analysis(comment_id: int, llm_response: dict):
    ai_summary = llm_response.get("ai_summary", "")
    now = timezone.now()
    analysis, _created = CommentAnalysisModel.objects.update_or_create(
        comment_id=comment_id, defaults={"ai_summary": ai_summary, "analyzed_at": now},
    )
    return analysis


def normalize_params(params: dict) -> dict:
    return {
        "focus": params.get("focus") or "fact_check",
        "depth": params.get("depth") or "quick",
        "tone": params.get("tone") or "match",
        "custom_instruction": (params.get("custom_instruction") or "").strip(),
    }


def count_requests_today(user_id: int) -> int:
    since = timezone.now() - datetime.timedelta(hours=24)
    return BlogCommentModel.objects.filter(user_id=user_id, strType="analysis_request", datePosted__gte=since).count()


def find_duplicate_request(blog_id: int, params: dict):
    return BlogCommentModel.objects.filter(
        blog_id=blog_id, strType="analysis_request", jsonAnalysisParams=params,
    ).first()


def create_analysis_request(blog_id: int, user, params: dict):
    focus = params["focus"].replace("_", " ")
    return BlogCommentModel.objects.create(
        blog_id=blog_id, user_id=user.id, strAuthor=user.username, strType="analysis_request",
        jsonAnalysisParams=params, strContent=f"Requested an AI analysis ({focus}, {params['depth']}).",
    )


def create_analysis_response(blog_id: int, parent_id: int, result: dict, model_used: str):
    from myapps.users.models import UserModel
    ai_user = UserModel.objects.filter(username=SYNAPSE_AI_USERNAME).first()
    return BlogCommentModel.objects.create(
        blog_id=blog_id, parent_comment_id=parent_id, user_id=ai_user.id if ai_user else None,
        strAuthor=APPROVER_DISPLAY_NAME, strType="analysis_response",
        strContent=result.get("response_text", ""), jsonAnalysisResult=result, strModelUsed=model_used,
    )


def count_analyze_actions_today(user_id: int) -> int:
    from myapps.users.models import AnalysisUsageModel
    since = timezone.now() - datetime.timedelta(hours=24)
    return AnalysisUsageModel.objects.filter(user_id=user_id, created_at__gte=since).count()


def log_analyze_action(user_id: int):
    from myapps.users.models import AnalysisUsageModel
    AnalysisUsageModel.objects.create(user_id=user_id)
