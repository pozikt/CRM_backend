from pydantic import BaseModel

class StatusBase(BaseModel):
    name: str
    is_default: bool = False

class StatusCreate(StatusBase):
    pass

class StatusOut(StatusBase):
    id: int

    class Config:
        from_attributes = True