import cloudinary.uploader
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from myapps.users.permissions import IsAuthenticatedActive

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024


@api_view(["POST"])
@permission_classes([AllowAny])
def log_activity(request):
    events = request.data.get("events", [])
    return Response({"status": "ok", "received": len(events)})


@api_view(["POST"])
@permission_classes([IsAuthenticatedActive])
@parser_classes([MultiPartParser])
def upload_image(request):
    file = request.FILES.get("file")
    if not file:
        raise ValidationError("No file provided")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationError("Only JPEG, PNG, WEBP, or GIF images are allowed")
    if file.size > MAX_IMAGE_BYTES:
        raise ValidationError("Image must be under 8MB")

    result = cloudinary.uploader.upload(file, folder="synapse")
    return Response({"url": result["secure_url"]})
