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
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=300,
    task_time_limit=600,
    worker_max_tasks_per_child=100,
)

celery_app.autodiscover_tasks(["app.tasks"])
