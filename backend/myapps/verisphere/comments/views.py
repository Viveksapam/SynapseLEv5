from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny

from myapps.verisphere.comments import permissions as comment_permissions
from myapps.verisphere.comments import services
from myapps.verisphere.comments.models import BlogCommentModel
from myapps.verisphere.comments.serializers import (
    BlogCommentCreateSerializer,
    BlogCommentSerializer,
    CommentAnalysisCreateSerializer,
    CommentAnalysisSerializer,
)
from myapps.verisphere.engagement import services as engagement_services
from myapps.verisphere.posts import services as post_services
from myapps.users.permissions import IsAuthenticatedActive
from myproject.view_helpers import require_active, skip_limit, validated
from rest_framework.response import Response


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def blog_comments(request, blog_id):
    if request.method == "GET":
        blog = post_services.get_blog_by_id(blog_id)
        if not blog:
            raise NotFound("Blog not found")
        skip, limit = skip_limit(request)
        comments = services.get_blog_comments(blog_id, skip=skip, limit=limit)
        return Response(BlogCommentSerializer(comments, many=True).data)

    require_active(request)
    blog = post_services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")
    current_user = request.user
    data = validated(BlogCommentCreateSerializer, request.data)
    comment_permissions.require_not_banned(blog, current_user)
    new_comment = services.create_blog_comment(blog_id, data, user_id=current_user.id, author_username=current_user.username)
    engagement_services.notify_engagement(
        blog.author_id, current_user, "comment_on_post",
        blog_id=blog_id, ref_table="comment", ref_id=new_comment.id,
    )
    return Response(BlogCommentSerializer(new_comment).data)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticatedActive])
def blog_comment_detail(request, blog_id, comment_id):
    current_user = request.user
    comment_permissions.require_comment_owner_or_admin(comment_id, current_user)
    if request.method == "PUT":
        data = validated(BlogCommentCreateSerializer, request.data)
        updated = services.update_blog_comment(comment_id, content=data["strContent"])
        if not updated:
            raise NotFound("Comment not found")
        return Response(BlogCommentSerializer(updated).data)

    if not services.delete_blog_comment(comment_id):
        raise NotFound("Comment not found")
    return Response({"message": "Comment deleted successfully"})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def comment_replies(request, blog_id, comment_id):
    if request.method == "GET":
        blog = post_services.get_blog_by_id(blog_id)
        if not blog:
            raise NotFound("Blog not found")
        skip, limit = skip_limit(request)
        replies = services.get_comment_replies(comment_id, skip=skip, limit=limit)
        return Response(BlogCommentSerializer(replies, many=True).data)

    require_active(request)
    blog = post_services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")
    current_user = request.user
    data = validated(BlogCommentCreateSerializer, request.data)
    comment_permissions.require_not_banned(blog, current_user)
    new_reply = services.create_comment_reply(blog_id, comment_id, current_user.id, current_user.username, data["strContent"])
    parent = BlogCommentModel.objects.filter(id=comment_id).first()
    engagement_services.notify_engagement(
        parent.user_id if parent else None, current_user, "reply_to_comment",
        blog_id=blog_id, ref_table="comment", ref_id=new_reply.id,
    )
    return Response(BlogCommentSerializer(new_reply).data)


@api_view(["GET", "POST", "DELETE"])
@permission_classes([AllowAny])
def comment_analysis(request, comment_id):
    if request.method == "GET":
        analysis = services.get_comment_analysis(comment_id)
        if not analysis:
            raise NotFound("Analysis not found")
        return Response(CommentAnalysisSerializer(analysis).data)
    if request.method == "POST":
        data = validated(CommentAnalysisCreateSerializer, request.data)
        analysis = services.create_or_update_comment_analysis(comment_id, data.get("ai_summary"))
        return Response(CommentAnalysisSerializer(analysis).data)
    if not services.delete_comment_analysis(comment_id):
        raise NotFound("Analysis not found")
    return Response({"message": "Analysis deleted successfully"})
