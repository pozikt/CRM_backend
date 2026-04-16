from pydantic import BaseModel
from typing import Optional

class PriorityBase(BaseModel):
    name: str
    color: str = "#CCCCCC"
    order: int = 0

class PriorityCreate(PriorityBase):
    pass

class PriorityUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None

class PriorityOut(PriorityBase):
    id: int

    class Config:
        from_attributes = True