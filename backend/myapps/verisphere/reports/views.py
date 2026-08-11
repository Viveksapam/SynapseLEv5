from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.verisphere.comments.models import BlogCommentModel
from myapps.verisphere.posts.models import BlogModel
from myapps.verisphere.reports.models import ReportModel
from myapps.verisphere.reports.serializers import ReportCreateSerializer, ReportResolveSerializer
from myapps.users.permissions import IsAdminUser
from myproject.view_helpers import require_active, require_admin, validated

CONTENT_TYPES = {"post", "comment"}
REASON_MAX_LENGTH = 300


def _find_content(content_type: str, content_id: int):
    if content_type == "post":
        return BlogModel.objects.filter(id=content_id).first()
    return BlogCommentModel.objects.filter(id=content_id).first()


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def reports_collection(request):
    if request.method == "GET":
        require_admin(request)
        reports = ReportModel.objects.filter(status="open").order_by("-created_at").select_related("reporter")
        result = []
        for r in reports:
            content = _find_content(r.content_type, r.content_id)
            if content is None:
                preview = "[content already deleted]"
            elif r.content_type == "post":
                preview = content.strTitle
            else:
                preview = content.strContent[:150]
            result.append({
                "id": r.id, "content_type": r.content_type, "content_id": r.content_id,
                "reason": r.reason, "reporter_username": r.reporter.username if r.reporter else None,
                "created_at": r.created_at.replace(tzinfo=None).isoformat() if r.created_at else None,
                "content_preview": preview,
            })
        return Response(result)

    require_active(request)
    current_user = request.user
    data = validated(ReportCreateSerializer, request.data)
    if data["content_type"] not in CONTENT_TYPES:
        raise ValidationError("content_type must be 'post' or 'comment'")

    reason = data["reason"].strip()
    if not reason:
        raise ValidationError("A reason is required")
    if len(reason) > REASON_MAX_LENGTH:
        raise ValidationError(f"Reason is limited to {REASON_MAX_LENGTH} characters")

    if not _find_content(data["content_type"], data["content_id"]):
        raise NotFound("Reported content not found")

    duplicate = ReportModel.objects.filter(
        content_type=data["content_type"], content_id=data["content_id"],
        reporter_id=current_user.id, status="open",
    ).first()
    if duplicate:
        return Response({"message": "You've already reported this - a moderator will review it."})

    ReportModel.objects.create(
        content_type=data["content_type"], content_id=data["content_id"],
        reporter_id=current_user.id, reason=reason,
    )
    return Response({"message": "Report submitted. A moderator will review it."})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def resolve_report(request, report_id):
    report = ReportModel.objects.filter(id=report_id).first()
    if not report:
        raise NotFound("Report not found")
    if report.status != "open":
        raise ValidationError("Report already resolved")
    data = validated(ReportResolveSerializer, request.data)
    if data["action"] not in {"dismiss", "remove_content"}:
        raise ValidationError("action must be 'dismiss' or 'remove_content'")

    if data["action"] == "remove_content":
        content = _find_content(report.content_type, report.content_id)
        if content is not None:
            content.delete()
        report.status = "removed"
    else:
        report.status = "dismissed"

    report.resolved_at = timezone.now()
    report.resolved_by_id = request.user.id
    report.save()
    return Response({"message": "Report resolved"})
