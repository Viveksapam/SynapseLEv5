from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.verisphere.posts import services
from myapps.verisphere.posts.serializers import BlogAuditCollectionSerializer, BlogResponseSerializer
from myapps.verisphere.comments import services as comment_services
from myapps.users.permissions import IsAdminUser, IsAuthenticatedActive
from myproject.exceptions import ServiceUnavailable
from llm_services import llm_audit
from llm_services.llm_audit import LlmAuditError

ANALYZE_DAILY_LIMIT = 5


@api_view(["POST"])
@permission_classes([IsAdminUser])
def run_blog_audit(request, blog_id):
    blog = services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")

    collection = services.create_audit_collection(blog_id)
    if not collection:
        raise ValidationError("Failed to create collection")

    try:
        llm_result = llm_audit.analyze_audit_collection(collection.collected_data)
    except LlmAuditError as e:
        raise ServiceUnavailable(str(e))

    collection = services.update_audit_collection_response(collection.id, llm_result)
    services.sync_audit_to_blog_analysis(blog_id, llm_result)
    for source_id in llm_result.get("approved_source_ids", []):
        from myapps.verisphere.sources import services as source_services
        source_services.approve_blog_source(source_id, approved_by="ai", approver_name=llm_audit.APPROVER_DISPLAY_NAME)

    return Response(BlogAuditCollectionSerializer(collection).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def set_llm_response(request, collection_id):
    llm_response = request.data
    collection = services.update_audit_collection_response(collection_id, llm_response)
    if not collection:
        raise NotFound("Collection not found")
    for source_id in llm_response.get("approved_source_ids", []):
        from myapps.verisphere.sources import services as source_services
        source_services.approve_blog_source(source_id, approved_by="ai", approver_name=llm_audit.APPROVER_DISPLAY_NAME)
    return Response({"message": "LLM response stored", "status": collection.status})


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def analyze_blog(request, blog_id):
    current_user = request.user
    blog = services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")

    if comment_services.count_analyze_actions_today(current_user.id) >= ANALYZE_DAILY_LIMIT:
        from rest_framework.exceptions import Throttled
        raise Throttled(detail=f"Analysis limit reached ({ANALYZE_DAILY_LIMIT} per day). Try again tomorrow.")

    collection = services.create_audit_collection(blog_id)
    if not collection:
        raise ValidationError("Failed to create collection")

    try:
        llm_result = llm_audit.analyze_audit_collection(collection.collected_data)
    except LlmAuditError as e:
        raise ServiceUnavailable(str(e))

    services.update_audit_collection_response(collection.id, llm_result)
    services.sync_audit_to_blog_analysis(blog_id, llm_result)
    for source_id in llm_result.get("approved_source_ids", []):
        from myapps.verisphere.sources import services as source_services
        source_services.approve_blog_source(source_id, approved_by="ai", approver_name=llm_audit.APPROVER_DISPLAY_NAME)
    comment_services.log_analyze_action(current_user.id)

    updated = services.get_blog_by_id(blog_id)
    return Response(BlogResponseSerializer(updated, context={"include_flattened_sources": True}).data)
