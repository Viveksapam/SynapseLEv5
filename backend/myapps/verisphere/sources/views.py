from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.verisphere.posts import services as post_services
from myapps.verisphere.sources import services
from myapps.verisphere.sources.serializers import BlogContextCreateSerializer, BlogContextSerializer, BlogSourceCreateSerializer, BlogSourceSerializer
from myapps.users.permissions import IsAdminUser
from myproject.view_helpers import validated


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def blog_contexts(request, blog_id):
    blog = post_services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")
    if request.method == "GET":
        return Response(BlogContextSerializer(services.get_blog_contexts(blog_id), many=True).data)
    data = validated(BlogContextCreateSerializer, request.data)
    context = services.create_blog_context(blog_id, data["strTitle"], data.get("strDescription"))
    return Response(BlogContextSerializer(context).data)


@api_view(["PUT", "DELETE"])
@permission_classes([AllowAny])
def blog_context_detail(request, blog_id, context_id):
    if request.method == "PUT":
        data = validated(BlogContextCreateSerializer, request.data)
        updated = services.update_blog_context(context_id, data["strTitle"], data.get("strDescription"))
        if not updated:
            raise NotFound("Context not found")
        return Response(BlogContextSerializer(updated).data)
    if not services.delete_blog_context(context_id):
        raise NotFound("Context not found")
    return Response({"message": "Context deleted successfully"})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def context_sources(request, context_id):
    if request.method == "GET":
        return Response(BlogSourceSerializer(services.get_context_sources(context_id), many=True).data)
    data = validated(BlogSourceCreateSerializer, request.data)
    source = services.create_source_in_context(context_id, data["strTitle"], data["strUrl"], data.get("strDescription"), data.get("strAuthor"))
    return Response(BlogSourceSerializer(source).data)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def blog_sources(request, blog_id):
    blog = post_services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")
    if request.method == "GET":
        status_filter = request.query_params.get("status")
        return Response(BlogSourceSerializer(services.get_blog_sources(blog_id, status=status_filter), many=True).data)
    data = validated(BlogSourceCreateSerializer, request.data)
    source = services.create_source_for_blog(blog_id, data["strTitle"], data["strUrl"], data.get("strDescription"), data.get("strAuthor"))
    return Response(BlogSourceSerializer(source).data)


@api_view(["PUT", "DELETE"])
@permission_classes([AllowAny])
def source_detail(request, source_id):
    if request.method == "PUT":
        data = validated(BlogSourceCreateSerializer, request.data)
        updated = services.update_blog_source(source_id, data["strTitle"], data["strUrl"], data.get("strAuthor"))
        if not updated:
            raise NotFound("Source not found")
        return Response(BlogSourceSerializer(updated).data)
    if not services.delete_blog_source(source_id):
        raise NotFound("Source not found")
    return Response({"message": "Source deleted successfully"})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def approve_source(request, source_id):
    updated = services.approve_blog_source(source_id, approved_by="admin", approver_name=request.user.username)
    if not updated:
        raise NotFound("Source not found")
    return Response(BlogSourceSerializer(updated).data)
