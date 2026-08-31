from fastapi import APIRouter

from app.schemas.worker import PingResponse, WorkerHealthResponse

router = APIRouter()


@router.get("/health", response_model=WorkerHealthResponse)
async def worker_health() -> WorkerHealthResponse:
    return WorkerHealthResponse(status="ok", service="MeetingMind Worker")


@router.post("/ping", response_model=PingResponse)
async def trigger_ping() -> PingResponse:
    from app.tasks.ping import ping_task

    result = ping_task.delay()
    return PingResponse(task_id=result.id, status="queued")
