from rest_framework.exceptions import NotFound, PermissionDenied

from myapps.verisphere.comments.models import BlogCommentModel
from myapps.verisphere.communities import services as community_services


def require_comment_owner_or_admin(comment_id: int, current_user):
    comment = BlogCommentModel.objects.select_related("blog").filter(id=comment_id).first()
    if not comment:
        raise NotFound("Comment not found")
    is_owner = comment.user_id is not None and comment.user_id == current_user.id
    is_community_creator = bool(
        comment.blog and comment.blog.community_id
        and community_services.is_creator(comment.blog.community_id, current_user.id)
    )
    if not is_owner and not is_community_creator and not current_user.is_superuser:
        raise PermissionDenied("Not allowed to modify this comment")
    return comment


def require_not_banned(blog, current_user):
    if blog.community_id and community_services.is_banned(blog.community_id, current_user.id):
        raise PermissionDenied("You are banned from this community")
