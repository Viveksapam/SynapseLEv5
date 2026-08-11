from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.mainsite.portfolio.models import ProjectModel, SkillModel, VideoModel
from myapps.mainsite.portfolio.serializers import ProjectSerializer, SkillSerializer, VideoSerializer


def _skip_limit(request):
    return int(request.query_params.get("skip", 0)), int(request.query_params.get("limit", 100))


@api_view(["GET"])
@permission_classes([AllowAny])
def skills(request):
    skip, limit = _skip_limit(request)
    qs = SkillModel.objects.all()[skip:skip + limit]
    return Response(SkillSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def videos(request):
    skip, limit = _skip_limit(request)
    qs = VideoModel.objects.all()[skip:skip + limit]
    return Response(VideoSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def projects(request):
    skip, limit = _skip_limit(request)
    qs = ProjectModel.objects.order_by("id")[skip:skip + limit]
    return Response(ProjectSerializer(qs, many=True).data)
