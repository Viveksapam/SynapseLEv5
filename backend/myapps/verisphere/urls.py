from django.urls import path

from myapps.verisphere.comments import analysis_views as comment_analysis_views
from myapps.verisphere.comments import views as comment_views
from myapps.verisphere.communities import views as community_views
from myapps.verisphere.posts import analysis_views as post_analysis_views
from myapps.verisphere.posts import views as post_views
from myapps.verisphere.reports import views as report_views
from myapps.verisphere.sources import views as source_views

urlpatterns = [
    path("blogs/featured/", post_views.featured_blogs),
    path("blogs/featured/<int:blog_id>", post_views.featured_blog_detail),
    path("blogs/", post_views.blogs_collection),
    path("blogs/<int:blog_id>/comments/", comment_views.blog_comments),
    path("blogs/<int:blog_id>/comments/<int:comment_id>", comment_views.blog_comment_detail),
    path("blogs/<int:blog_id>/comments/<int:comment_id>/replies/", comment_views.comment_replies),
    path("blogs/<int:blog_id>/react", post_views.toggle_reaction),
    path("blogs/<int:blog_id>/reactions", post_views.get_reactions),
    path("blogs/<int:blog_id>/contexts/", source_views.blog_contexts),
    path("contexts/<int:context_id>/sources/", source_views.context_sources),
    path("blogs/<int:blog_id>/sources/", source_views.blog_sources),
    path("sources/<int:source_id>/approve/", source_views.approve_source),
    path("recent-contributions/", post_views.recent_contributions),
    path("recent-contributions/<int:contribution_id>/position/", post_views.update_contribution_position),
    path("recent-contributions/<int:contribution_id>/", post_views.delete_recent_contribution),
    path("blogs/<int:blog_id>/audit/collect/", post_views.collect_audit_data),
    path("audit/collections/<int:collection_id>/", post_views.audit_collection_detail),
    path("blogs/<int:blog_id>/audit/collections/", post_views.blog_audit_collections),
    path("comments/<int:comment_id>/analysis/", comment_views.comment_analysis),

    path("blogs/<int:blog_id>/", post_views.update_post),
    path("blogs/<int:blog_id>/analysis-settings/", post_views.update_analysis_settings),
    path("blogs/<int:blog_id>", post_views.delete_post),

    path("communities/", community_views.communities_list),
    path("communities/<int:community_id>", community_views.community_detail),
    path("communities/<int:community_id>/join", community_views.join_community),
    path("communities/<int:community_id>/leave", community_views.leave_community),
    path("communities/<int:community_id>/members/", community_views.list_members),
    path("communities/<int:community_id>/ban/<int:user_id>", community_views.ban_member),
    path("communities/<int:community_id>/unban/<int:user_id>", community_views.unban_member),

    path("reports/", report_views.reports_collection),
    path("reports/<int:report_id>/resolve", report_views.resolve_report),

    path("blogs/<int:blog_id>/audit/run/", post_analysis_views.run_blog_audit),
    path("comments/<int:comment_id>/analyze/", comment_analysis_views.analyze_comment_endpoint),
    path("blogs/<int:blog_id>/comments/analyze-batch/", comment_analysis_views.analyze_comments_batch),
    path("blogs/<int:blog_id>/analysis/", post_analysis_views.analyze_blog),
    path("blogs/<int:blog_id>/analysis-requests/", comment_analysis_views.create_analysis_thread),
]
