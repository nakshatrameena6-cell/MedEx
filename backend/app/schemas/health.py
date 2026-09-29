from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field("ok", description="Application status")
    version: str = Field("1.1.0", description="API version")
    app: str = Field("MedEx API", description="Application name")
