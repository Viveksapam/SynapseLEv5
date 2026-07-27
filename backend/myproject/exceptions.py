from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException, ValidationError


class ServiceUnavailable(APIException):
    status_code = 503
    default_detail = "The AI service is temporarily unavailable."
    default_code = "service_unavailable"


def _first_message(detail):
    if isinstance(detail, list):
        return _first_message(detail[0]) if detail else ""
    if isinstance(detail, dict):
        for value in detail.values():
            return _first_message(value)
        return ""
    return str(detail)


def flat_detail_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None and isinstance(exc, ValidationError):
        response.data = {"detail": _first_message(response.data)}




        response.status_code = 422
    return response
