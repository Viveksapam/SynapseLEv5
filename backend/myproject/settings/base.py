import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from corsheaders.defaults import default_headers
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ["SECRET_KEY"]

# Separate signing key for JWTs so a SECRET_KEY rotation doesn't double as a mass token revocation
# (and vice versa). Falls back to SECRET_KEY if JWT_SIGNING_KEY isn't set, so this stays optional.
JWT_SIGNING_KEY = os.environ.get("JWT_SIGNING_KEY", SECRET_KEY)

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
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "djoser",
    "django_filters",
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

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            # Redis being unreachable shouldn't 500 every request (throttling,
            # sessions, and page caching all read this cache) - degrade to
            # cache misses instead.
            "IGNORE_EXCEPTIONS": True,
        },
    }
}
DJANGO_REDIS_LOG_IGNORED_EXCEPTIONS = True

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"

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
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "EXCEPTION_HANDLER": "myproject.exceptions.flat_detail_exception_handler",
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S.%f",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": JWT_SIGNING_KEY,
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://synapseislive.com")
FRONTEND_DOMAIN = FRONTEND_URL.split("://", 1)[-1]
FRONTEND_PROTOCOL = FRONTEND_URL.split("://", 1)[0] if "://" in FRONTEND_URL else "https"

DEFAULT_FROM_EMAIL = VERIFICATION_EMAIL_FROM
EMAIL_BACKEND = "myapps.users.email_backend.ResendEmailBackend"

DJOSER = {
    "LOGIN_FIELD": "username",
    "USER_CREATE_PASSWORD_RETYPE": False,
    "SEND_ACTIVATION_EMAIL": True,
    "SEND_CONFIRMATION_EMAIL": False,
    "PASSWORD_RESET_CONFIRM_URL": "reset-password/{uid}/{token}",
    "ACTIVATION_URL": "activate/{uid}/{token}",
    "USERNAME_RESET_CONFIRM_RETYPE": False,
    "PASSWORD_RESET_SHOW_EMAIL_NOT_FOUND": False,
    "EMAIL_FRONTEND_DOMAIN": FRONTEND_DOMAIN,
    "EMAIL_FRONTEND_PROTOCOL": FRONTEND_PROTOCOL,
    "EMAIL_FRONTEND_SITE_NAME": "Synapse LE",
    "SERIALIZERS": {
        "user_create": "myapps.users.serializers.DjoserUserCreateSerializer",
        "user": "myapps.users.serializers.DjoserUserSerializer",
        "current_user": "myapps.users.serializers.DjoserUserSerializer",
    },
    "EMAIL": {
        "activation": "myapps.users.emails.ActivationEmail",
        "password_reset": "myapps.users.emails.PasswordResetEmail",
    },
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
