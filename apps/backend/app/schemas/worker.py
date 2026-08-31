from pydantic import BaseModel, ConfigDict


class WorkerHealthResponse(BaseModel):
    status: str
    service: str

    model_config = ConfigDict(extra="forbid")


class PingResponse(BaseModel):
    task_id: str
    status: str

    model_config = ConfigDict(extra="forbid")
