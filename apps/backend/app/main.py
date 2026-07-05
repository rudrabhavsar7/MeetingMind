from collections.abc import Awaitable, Callable
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request, Response

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging

REQUEST_ID_HEADER = "X-Request-ID"
PROCESS_TIME_HEADER = "X-Process-Time"


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    configure_logging(app_settings)

    app = FastAPI(
        title=app_settings.app_name,
        debug=app_settings.debug,
        version=app_settings.version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{app_settings.api_v1_prefix}/openapi.json",
    )

    @app.middleware("http")
    async def request_context_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER, str(uuid4()))
        request.state.request_id = request_id

        started_at = perf_counter()
        response = await call_next(request)
        response.headers[REQUEST_ID_HEADER] = request_id
        response.headers[PROCESS_TIME_HEADER] = f"{perf_counter() - started_at:.6f}"
        return response

    @app.get("/health", tags=["health"])
    async def root_health() -> dict[str, str]:
        return {"status": "ok", "service": app_settings.app_name}

    app.include_router(api_router, prefix=app_settings.api_v1_prefix)
    return app


app = create_app()
