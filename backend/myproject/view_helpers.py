from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import LimitOffsetPagination

from myapps.users.permissions import IsAdminUser, IsAuthenticatedActive


def skip_limit(request):
    return int(request.query_params.get("skip", 0)), int(request.query_params.get("limit", 100))


class SkipLimitPagination(LimitOffsetPagination):
    """DRF LimitOffsetPagination with the existing `skip`/`limit` query param names."""

    offset_query_param = "skip"
    default_limit = 100
    max_limit = 200


def validated(serializer_cls, data):
    s = serializer_cls(data=data)
    s.is_valid(raise_exception=True)
    return s.validated_data


def require_active(request):
    IsAuthenticatedActive().has_permission(request, None)


def require_admin(request):
    perm = IsAdminUser()
    if not perm.has_permission(request, None):
        raise PermissionDenied(perm.message)
