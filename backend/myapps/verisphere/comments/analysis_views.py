import json

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound, PermissionDenied, Throttled, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.verisphere.comments import services
from myapps.verisphere.comments.models import BlogCommentModel
from myapps.verisphere.comments.serializers import AnalysisRequestCreateSerializer, BlogCommentSerializer, CommentAnalysisSerializer
from myapps.verisphere.posts import services as post_services
from myapps.verisphere.engagement import services as engagement_services
from myapps.users.permissions import IsAdminUser, IsAuthenticatedActive
from myproject.exceptions import ServiceUnavailable
from myproject.view_helpers import validated
from llm_services import llm_audit
from llm_services.llm_audit import LlmAuditError, _MODEL_NAME
from llm_services import llm_thread_analysis

ANALYZE_DAILY_LIMIT = 5
DAILY_REQUEST_LIMIT = 5
_FOCUS_OPTIONS = {"fact_check", "sources", "logic", "clarity", "react_in_kind"}
_DEPTH_OPTIONS = {"quick", "deep"}
_TONE_OPTIONS = {"match", "formal"}
_CUSTOM_INSTRUCTION_MAX = 300


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def analyze_comment_endpoint(request, comment_id):
    current_user = request.user
    comment = BlogCommentModel.objects.filter(id=comment_id).first()
    if not comment:
        raise NotFound("Comment not found")

    if services.count_analyze_actions_today(current_user.id) >= ANALYZE_DAILY_LIMIT:
        raise Throttled(detail=f"Analysis limit reached ({ANALYZE_DAILY_LIMIT} per day). Try again tomorrow.")

    collection = services.create_comment_audit_collection(comment_id)
    if not collection:
        raise ValidationError("Failed to create collection")

    try:
        llm_result = llm_audit.analyze_comment_audit(json.loads(collection.collected_data))
    except LlmAuditError as e:
        raise ServiceUnavailable(str(e))

    services.update_comment_audit_collection_response(collection.id, llm_result)
    analysis = services.sync_comment_audit_to_analysis(comment_id, llm_result)
    services.log_analyze_action(current_user.id)

    return Response(CommentAnalysisSerializer(analysis).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def analyze_comments_batch(request, blog_id):
    blog = post_services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")

    batch = services.build_comment_batch_payload(blog_id)
    if not batch or not batch["comments"]:
        return Response({"analyzed": []})

    try:
        llm_result = llm_audit.analyze_comment_batch(batch)
    except LlmAuditError as e:
        raise ServiceUnavailable(str(e))

    analyzed = []
    for item in llm_result.get("results", []):
        comment_id = item.get("comment_id")
        if comment_id is None:
            continue
        analysis = services.sync_comment_audit_to_analysis(comment_id, item)
        analyzed.append({
            "comment_id": comment_id,
            "ai_summary": analysis.ai_summary,
            "analyzed_at": analysis.analyzed_at.replace(tzinfo=None).isoformat() if analysis.analyzed_at else None,
        })

    return Response({"analyzed": analyzed})


def _validate_thread_params(data):
    if data["focus"] not in _FOCUS_OPTIONS:
        raise ValidationError(f"focus must be one of {sorted(_FOCUS_OPTIONS)}")
    if data["depth"] not in _DEPTH_OPTIONS:
        raise ValidationError(f"depth must be one of {sorted(_DEPTH_OPTIONS)}")
    if data["tone"] not in _TONE_OPTIONS:
        raise ValidationError(f"tone must be one of {sorted(_TONE_OPTIONS)}")
    instruction = (data.get("custom_instruction") or "").strip()
    if len(instruction) > _CUSTOM_INSTRUCTION_MAX:
        raise ValidationError(f"custom_instruction is limited to {_CUSTOM_INSTRUCTION_MAX} characters")
    return services.normalize_params(data)


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def create_analysis_thread(request, blog_id):
    current_user = request.user
    blog = post_services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")

    if blog.strAnalysisMode == "off":
        raise PermissionDenied("The author has not opened this post to analysis.")
    data = validated(AnalysisRequestCreateSerializer, request.data)
    if blog.strAnalysisMode == "limited":
        allowed = set(json.loads(blog.jsonAllowedAnalysisFocus or "[]"))
        if data["focus"] not in allowed:
            raise PermissionDenied(f"The author opened this post to these lenses only: {sorted(allowed)}")

    params_json = _validate_thread_params(data)

    duplicate = services.find_duplicate_request(blog_id, params_json)
    if duplicate:
        return Response({
            "request": BlogCommentSerializer(duplicate).data, "response": None, "deduplicated": True,
        })

    if services.count_requests_today(current_user.id) >= DAILY_REQUEST_LIMIT:
        raise Throttled(detail=f"Analysis request limit reached ({DAILY_REQUEST_LIMIT} per day). Try again tomorrow.")

    request_comment = services.create_analysis_request(blog_id, current_user, params_json)
    try:
        collection = post_services.create_audit_collection(blog_id)
        result = llm_thread_analysis.analyze_post_thread(json.loads(collection.collected_data), json.loads(params_json))
    except LlmAuditError as e:
        services.delete_comment_row(request_comment.id)
        raise ServiceUnavailable(str(e))

    model_used = "mock" if settings.USE_MOCK_LLM else _MODEL_NAME
    response_comment = services.create_analysis_response(blog_id, request_comment.id, result, model_used)

    engagement_services.notify_engagement(
        blog.author_id, current_user, "analysis_on_post",
        blog_id=blog_id, ref_table="comment", ref_id=response_comment.id,
    )
    if result.get("assessment") == "supported" and blog.author_id and blog.author_id != current_user.id:
        engagement_services.record_reputation_event(
            blog.author_id, current_user.id, "analysis_favorable", 2, "comment", response_comment.id,
        )
        engagement_services.award_badge(blog.author_id, "well_sourced", "comment", response_comment.id)
    engagement_services.award_badge(current_user.id, "curious_mind", "comment", request_comment.id)

    return Response({
        "request": BlogCommentSerializer(request_comment).data,
        "response": BlogCommentSerializer(response_comment).data,
        "deduplicated": False,
    })
