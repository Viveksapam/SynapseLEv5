FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DJANGO_ENV=production
# migrate before serving - idempotent (already-applied migrations are
# skipped), mirrors the old app's own auto-schema-sync-on-boot behavior
# (main.py's Base.metadata.create_all() calls). ${PORT:-8000} binding
# preserved exactly - see commit a68e67e (Render's dynamic PORT fix).
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn myproject.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
