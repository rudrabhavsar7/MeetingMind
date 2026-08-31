from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.extension import router as extension_router
from app.api.v1.health import router as health_router
from app.api.v1.meetings import router as meetings_router
from app.api.v1.users import router as users_router
from app.api.v1.worker import router as worker_router
from app.api.v1.workspaces import router as workspaces_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(extension_router, prefix="/extension", tags=["extension"])
api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(worker_router, prefix="/worker", tags=["worker"])
api_router.include_router(workspaces_router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(meetings_router, prefix="/workspaces/{workspace_id}/meetings", tags=["meetings"])
