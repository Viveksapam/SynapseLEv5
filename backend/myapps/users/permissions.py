from rest_framework.exceptions import APIException, NotAuthenticated
from rest_framework.permissions import BasePermission


class InactiveUserError(APIException):


    status_code = 400
    default_detail = "Inactive user"
    default_code = "inactive_user"


def _require_authenticated_active(request):
    if not request.user or not request.user.is_authenticated:
        if getattr(request, "_jwt_auth_failure", None) == "invalid_token":
            raise NotAuthenticated(detail="Could not validate credentials")
        raise NotAuthenticated(detail="Not authenticated")
    if not request.user.is_active:
        raise InactiveUserError()


class IsAuthenticatedActive(BasePermission):

    def has_permission(self, request, view):
        _require_authenticated_active(request)
        return True


class IsStaffUser(BasePermission):
    message = "Not enough privileges (Requires Staff)"

    def has_permission(self, request, view):
        _require_authenticated_active(request)
        return bool(request.user.is_staff or request.user.is_superuser)


class IsAdminUser(BasePermission):
    message = "Not enough privileges (Requires Admin)"

    def has_permission(self, request, view):
        _require_authenticated_active(request)
        return bool(request.user.is_superuser)
