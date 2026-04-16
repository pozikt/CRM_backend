from pydantic import BaseModel
from typing import Optional

class StatusBase(BaseModel):
    name: str
    is_default: bool = False

class StatusCreate(StatusBase):
    pass

class StatusUpdate(BaseModel):
    name: Optional[str] = None
    is_default: Optional[bool] = None

class StatusOut(StatusBase):
    id: int

    class Config:
        from_attributes = True