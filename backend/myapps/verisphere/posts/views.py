import re

from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.verisphere.communities import services as community_services
from myapps.verisphere.engagement import services as engagement_services
from myapps.verisphere.posts import services
from myapps.verisphere.posts.filters import BlogListView
from myapps.verisphere.posts.models import BlogModel
from myapps.verisphere.posts.serializers import (
    AnalysisSettingsUpdateSerializer,
    BlogAuditCollectionSerializer,
    BlogResponseSerializer,
    PostCreateSerializer,
    PostUpdateSerializer,
    ReactionRequestSerializer,
    RecentContributionPositionSerializer,
)
from myapps.users.permissions import IsAdminUser, IsAuthenticatedActive
from myproject.view_helpers import SkipLimitPagination, require_active, require_admin, skip_limit, validated


FEATURED_BLOGS_CACHE_TTL = 30
FEATURED_BLOGS_CACHE_VERSION_KEY = "verisphere:featured_blogs:version"


def _featured_blogs_cache_version() -> int:
    return cache.get(FEATURED_BLOGS_CACHE_VERSION_KEY, 1)


def _bump_featured_blogs_cache_version():
    try:
        cache.incr(FEATURED_BLOGS_CACHE_VERSION_KEY)
    except ValueError:
        cache.set(FEATURED_BLOGS_CACHE_VERSION_KEY, 2)


@api_view(["GET"])
@permission_classes([AllowAny])
def featured_blogs(request):
    skip, limit = skip_limit(request)
    version = _featured_blogs_cache_version()
    cache_key = f"verisphere:featured_blogs:{version}:{skip}:{limit}"
    data = cache.get(cache_key)
    if data is None:
        blogs = services.get_featured_blogs(skip=skip, limit=limit)
        featured_ids = {b.id for b in blogs}
        data = BlogResponseSerializer(blogs, many=True, context={"featured_ids": featured_ids}).data
        cache.set(cache_key, data, FEATURED_BLOGS_CACHE_TTL)
    return Response(data)


@api_view(["POST", "DELETE"])
@permission_classes([IsAdminUser])
def featured_blog_detail(request, blog_id):
    if request.method == "POST":
        services.add_featured_blog(blog_id)
        _bump_featured_blogs_cache_version()  # bust only the featured-list cache, not the whole cache backend
        return Response({"message": "Blog featured successfully"})
    services.remove_featured_blog(blog_id)
    _bump_featured_blogs_cache_version()
    return Response({"message": "Blog removed from featured list"})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def blogs_collection(request):
    if request.method == "GET":
        queryset = services.get_blogs_queryset()
        queryset = DjangoFilterBackend().filter_queryset(request, queryset, BlogListView)
        queryset = OrderingFilter().filter_queryset(request, queryset, BlogListView)

        paginator = SkipLimitPagination()
        page = paginator.paginate_queryset(queryset, request)
        blogs = page if page is not None else queryset

        data = BlogResponseSerializer(blogs, many=True).data
        return Response(data)
    require_active(request)
    return _create_post(request)


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
def toggle_reaction(request, blog_id):
    current_user = request.user
    data = validated(ReactionRequestSerializer, request.data)
    result = services.toggle_reaction(blog_id, current_user.id, data["emoji"])
    if result.get("status") in ("added", "removed"):
        blog = services.get_blog_by_id(blog_id)
        engagement_services.notify_engagement(
            blog.author_id if blog else None, current_user,
            "reaction_received" if result["status"] == "added" else "reaction_removed",
            blog_id=blog_id, ref_table="post", ref_id=blog_id,
            reputation_weight=1 if result["status"] == "added" else -1,
        )
    return Response(result)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_reactions(request, blog_id):
    all_reactions = services.get_post_reactions(blog_id)
    user = request.user if request.user and request.user.is_authenticated else None
    user_reactions = services.get_user_reactions(blog_id, user.id) if user else []
    return Response({"reactions": all_reactions, "user_reacted": {emoji: True for emoji in user_reactions}})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def recent_contributions(request):
    if request.method == "GET":
        contributions = services.get_recent_contributions()
        blogs = [c.blog for c in contributions if c.blog_id]
        featured_blogs_list = services.get_featured_blogs(skip=0, limit=1000)
        featured_ids = {b.id for b in featured_blogs_list}
        return Response(BlogResponseSerializer(blogs, many=True, context={"featured_ids": featured_ids}).data)

    require_admin(request)
    data = validated(RecentContributionPositionSerializer, request.data)
    contribution = services.add_to_recent_contributions(data["blog_id"], data["position"], request.user.id)
    return Response({"id": contribution.id, "blog_id": contribution.blog_id, "position": contribution.position})


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_contribution_position(request, contribution_id):
    position = int(request.query_params.get("position") or request.data.get("position"))
    updated = services.update_contribution_position(contribution_id, position)
    if not updated:
        raise NotFound("Contribution not found")
    return Response({"id": updated.id, "blog_id": updated.blog_id, "position": updated.position})


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_recent_contribution(request, contribution_id):
    if not services.remove_from_recent_contributions(contribution_id):
        raise NotFound("Contribution not found")
    return Response({"message": "Contribution removed successfully"})


@api_view(["POST"])
@permission_classes([AllowAny])
def collect_audit_data(request, blog_id):
    blog = services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")
    collection = services.create_audit_collection(blog_id)
    if not collection:
        raise ValidationError("Failed to create collection")
    return Response(BlogAuditCollectionSerializer(collection).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def audit_collection_detail(request, collection_id):
    collection = services.get_audit_collection(collection_id)
    if not collection:
        raise NotFound("Collection not found")
    return Response(BlogAuditCollectionSerializer(collection).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def blog_audit_collections(request, blog_id):
    blog = services.get_blog_by_id(blog_id)
    if not blog:
        raise NotFound("Blog not found")
    return Response(BlogAuditCollectionSerializer(services.get_blog_audit_collections(blog_id), many=True).data)


POST_TYPES = {"claim", "opinion", "thought", "question", "mixed"}
ANALYSIS_MODES = {"open", "limited", "off"}
FOCUS_OPTIONS = {"fact_check", "sources", "logic", "clarity", "react_in_kind"}


def _derive_summary(content: str, limit: int = 180) -> str:
    text = re.sub(r"[#*_`>\[\]()!-]", " ", content)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit] + ("..." if len(text) > limit else "")


def _validate_analysis(mode, focus_list):
    if mode not in ANALYSIS_MODES:
        raise ValidationError(f"strAnalysisMode must be one of {sorted(ANALYSIS_MODES)}")
    if mode == "limited":
        if not focus_list or not set(focus_list) <= FOCUS_OPTIONS:
            raise ValidationError(f"allowed_analysis_focus must be a non-empty subset of {sorted(FOCUS_OPTIONS)}")
        return sorted(set(focus_list))
    return None


def _create_post(request):
    current_user = request.user
    data = validated(PostCreateSerializer, request.data)
    if not data["strTitle"].strip() or not data["strContent"].strip():
        raise ValidationError("Title and content are required")
    if data["strPostType"] not in POST_TYPES:
        raise ValidationError(f"strPostType must be one of {sorted(POST_TYPES)}")

    community = None
    if data.get("community_id") is not None:
        community = community_services.get_community(data["community_id"])
        if not community:
            raise NotFound("Community not found")
        if community_services.is_banned(community.id, current_user.id):
            raise PermissionDenied("You are banned from this community")
        if not community_services.is_active_member(community.id, current_user.id):
            raise PermissionDenied("Join the community before posting into it")

    mode = data.get("strAnalysisMode")
    if mode is None:
        mode = "open" if (community is None or community.analysis_default) else "off"
    focus_json = _validate_analysis(mode, data.get("allowed_analysis_focus"))

    content = data["strContent"].strip()
    references = data.get("strReferences")
    if references and references.strip():
        content += f"\n\nReferences: {references.strip()}"

    post = BlogModel.objects.create(
        author_id=current_user.id,
        community_id=community.id if community else None,
        strTitle=data["strTitle"].strip()[:255],
        strSummary=_derive_summary(content),
        strContent=content,
        strMediaUrl=(data.get("strMediaUrl") or None),
        strPostType=data["strPostType"],
        strAnalysisMode=mode,
        jsonAllowedAnalysisFocus=focus_json,
    )
    engagement_services.award_badge(current_user.id, "first_post", "post", post.id)
    return Response(BlogResponseSerializer(post).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticatedActive])
def update_post(request, blog_id):
    current_user = request.user
    post = services.get_blog_by_id(blog_id)
    if not post:
        raise NotFound("Blog not found")
    if post.author_id != current_user.id and not current_user.is_superuser:
        raise PermissionDenied("Only the author can edit this post")

    data = validated(PostUpdateSerializer, request.data)
    if data.get("strPostType") is not None and data["strPostType"] not in POST_TYPES:
        raise ValidationError(f"strPostType must be one of {sorted(POST_TYPES)}")

    if data.get("strTitle") is not None:
        if not data["strTitle"].strip():
            raise ValidationError("Title cannot be empty")
        post.strTitle = data["strTitle"].strip()[:255]
    if data.get("strContent") is not None:
        if not data["strContent"].strip():
            raise ValidationError("Content cannot be empty")
        post.strContent = data["strContent"].strip()
        post.strSummary = _derive_summary(post.strContent)
    if data.get("strMediaUrl") is not None:
        post.strMediaUrl = data["strMediaUrl"].strip() or None
    if data.get("strPostType") is not None:
        post.strPostType = data["strPostType"]

    post.save()
    return Response(BlogResponseSerializer(post).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticatedActive])
def update_analysis_settings(request, blog_id):
    current_user = request.user
    post = services.get_blog_by_id(blog_id)
    if not post:
        raise NotFound("Blog not found")
    if post.author_id != current_user.id and not current_user.is_superuser:
        raise PermissionDenied("Only the author can change analysis settings")

    data = validated(AnalysisSettingsUpdateSerializer, request.data)
    post.jsonAllowedAnalysisFocus = _validate_analysis(data["strAnalysisMode"], data.get("allowed_analysis_focus"))
    post.strAnalysisMode = data["strAnalysisMode"]
    post.save()
    return Response(BlogResponseSerializer(post).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticatedActive])
def delete_post(request, blog_id):
    current_user = request.user
    post = services.get_blog_by_id(blog_id)
    if not post:
        raise NotFound("Blog not found")
    is_owner = post.author_id == current_user.id
    is_community_creator = bool(post.community_id) and community_services.is_creator(post.community_id, current_user.id)
    if not (is_owner or is_community_creator or current_user.is_superuser):
        raise PermissionDenied("Not allowed to remove this post")
    post.delete()
    return Response({"message": "Post removed"})
