import os
from pathlib import Path

import dj_database_url
from corsheaders.defaults import default_headers
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ["SECRET_KEY"]


JWT_ALGORITHM = os.environ.get("ALGORITHM", "HS256")




JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
USE_MOCK_LLM = os.environ.get("USE_MOCK_LLM", "True") == "True"
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
VERIFICATION_EMAIL_FROM = os.environ.get(
    "VERIFICATION_EMAIL_FROM", "The Synapse LE Team <noreply@synapseislive.com>"
)


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "myapps.users",
    "myapps.mainsite.portfolio",
    "myapps.mainsite.merch",
    "myapps.verisphere.posts",
    "myapps.verisphere.comments",
    "myapps.verisphere.communities",
    "myapps.verisphere.sources",
    "myapps.verisphere.reports",
    "myapps.verisphere.engagement",
    "myapps.assessments",
    "myapps.classroom",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "myproject.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "myproject.wsgi.application"

DATABASES = {
    "default": dj_database_url.parse(
        os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=300,
        conn_health_checks=True,
    )
}

AUTH_USER_MODEL = "users.UserModel"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]






PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["myapps.users.authentication.LegacyJWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "EXCEPTION_HANDLER": "myproject.exceptions.flat_detail_exception_handler",








    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S.%f",
}


CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://192.168.1.35:5173",
    "https://synapseislive.com",
    "https://www.synapseislive.com",
    "https://synapseliveexchange.vercel.app",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + ["cache-control", "pragma"]
