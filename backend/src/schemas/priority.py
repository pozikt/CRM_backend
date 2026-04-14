from pydantic import BaseModel

class PriorityBase(BaseModel):
    name: str
    color: str = "#CCCCCC"
    order: int = 0

class PriorityCreate(PriorityBase):
    pass

class PriorityOut(PriorityBase):
    id: int

    class Config:
        from_attributes = True