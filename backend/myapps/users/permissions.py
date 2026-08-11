from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import BasePermission


def _require_authenticated_active(request):
    # JWTAuthentication already rejects inactive users at the authentication layer
    # (401), so by the time a permission class runs, request.user is authenticated
    # and active or this request never got here.
    if not request.user or not request.user.is_authenticated:
        raise NotAuthenticated(detail="Not authenticated")


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
