"""
Django 5.1 Settings for Shiraz University Fall 2026 SAD Project
Integrates PostgreSQL/SQLite, Redis Cache, and Server-Side Gemini AI Core.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "shiraz-sad-fall-2026-dev-key")
DEBUG = os.environ.get("DEBUG", "True") == "True"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "shiraz-sad-ai-cache",
    }
}

# Gemini AI Core Configuration (Never exposed to client)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_DEFAULT_MODEL = "gemini-3.8-flash"
AI_RATE_LIMIT_PER_MINUTE = 20

CORS_ALLOW_ALL_ORIGINS = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
