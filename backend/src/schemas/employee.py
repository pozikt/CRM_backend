from pydantic import BaseModel, EmailStr
from typing import Optional

class EmployeeCreate(BaseModel):
    full_name: str
    role: str
    email: Optional[EmailStr] = None
    telegram: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[EmailStr] = None
    telegram: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class EmployeeOut(BaseModel):
    id: int
    full_name: str
    role: str
    email: Optional[str] = None
    telegram: Optional[str] = None
    is_active: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True