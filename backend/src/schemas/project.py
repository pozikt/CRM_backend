from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .status import StatusOut
from .priority import PriorityOut
from .employee import EmployeeOut

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status_id: int
    priority_id: int
    manager_id: Optional[int] = None
    start_date: Optional[datetime] = None
    deadline_date: Optional[datetime] = None
    progress: float = 0.0
    client_name: Optional[str] = None
    client_contact: Optional[str] = None
    tags: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status_id: Optional[int] = None
    priority_id: Optional[int] = None
    manager_id: Optional[int] = None
    start_date: Optional[datetime] = None
    deadline_date: Optional[datetime] = None
    progress: Optional[float] = None
    client_name: Optional[str] = None
    client_contact: Optional[str] = None
    tags: Optional[str] = None

class ProjectOut(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    status: Optional[StatusOut]
    priority: Optional[PriorityOut]
    manager: Optional[EmployeeOut]

    class Config:
        from_attributes = True