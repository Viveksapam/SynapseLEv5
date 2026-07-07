from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Any

router = APIRouter(prefix="/api/activity", tags=["activity"])

class ActivityLogRequest(BaseModel):
    session_id: str
    events: List[Any]

@router.post("/log/")
def log_activity(req: ActivityLogRequest):
    # Dummy endpoint to absorb telemetry events without saving them
    return {"status": "ok", "received": len(req.events)}
