from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class CallStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CallParticipantOut(BaseModel):
    id: int
    employee_id: int
    employee: Optional['EmployeeOut'] = None

    class Config:
        from_attributes = True


class CallBase(BaseModel):
    project_id: int
    title: Optional[str] = None
    scheduled_datetime: str
    duration_minutes: int = Field(60, ge=1, le=480)
    meeting_link: Optional[str] = None
    result: Optional[str] = None
    status: CallStatus = CallStatus.SCHEDULED


class CallCreate(CallBase):
    participant_ids: List[int] = []


class CallUpdate(BaseModel):
    project_id: Optional[int] = None
    title: Optional[str] = None
    scheduled_datetime: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    meeting_link: Optional[str] = None
    result: Optional[str] = None
    status: Optional[CallStatus] = None
    participant_ids: Optional[List[int]] = None


class CallOut(CallBase):
    id: int
    created_at: str
    updated_at: str
    project: Optional['ProjectOut'] = None
    participants: List[CallParticipantOut] = []

    class Config:
        from_attributes = True


from schemas.employee import EmployeeOut
from schemas.project import ProjectOut