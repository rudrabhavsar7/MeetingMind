import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="ping")
def ping_task(self: object) -> dict[str, str]:
    logger.info("Ping task executed")
    return {"status": "pong"}
