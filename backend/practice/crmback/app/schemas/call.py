from pydantic import BaseModel
from datetime import datetime

class CallCreate(BaseModel):
    scheduled_datetime: datetime
    meeting_link: str | None = None

class CallUpdate(BaseModel):
    scheduled_datetime: datetime | None = None
    meeting_link: str | None = None

class CallOut(BaseModel):
    id: int
    scheduled_datetime: datetime
    meeting_link: str | None = None

    class Config:
        from_attributes = True