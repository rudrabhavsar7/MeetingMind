from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "meetingmind",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.tasks.transcription.*": {"queue": "transcription"},
        "app.tasks.summarization.*": {"queue": "ai"},
        "app.tasks.embedding.*": {"queue": "ai"},
    },
)

celery_app.autodiscover_tasks(["app.tasks"])
