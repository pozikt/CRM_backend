from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class EmployeeCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Полное имя сотрудника")
    role: str = Field(..., min_length=1, max_length=100, description="Должность")
    email: Optional[EmailStr] = Field(None, description="Email сотрудника")
    telegram: Optional[str] = Field(None, max_length=100, description="Telegram username (с @ или без)")
    is_active: bool = Field(True, description="Активен ли сотрудник")
    notes: Optional[str] = Field(None, max_length=5000, description="Заметки")
    
    @field_validator('telegram')
    @classmethod
    def validate_telegram(cls, v: Optional[str]) -> Optional[str]:
        """Автоматически добавляет @ в начало, если его нет"""
        if v and not v.startswith('@'):
            return f'@{v}'
        return v
    
    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Убирает лишние пробелы и делает первый заглавной каждое слово"""
        if v:
            v = ' '.join(v.split())
            return v.title()
        return v


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255, description="Полное имя сотрудника")
    role: Optional[str] = Field(None, min_length=1, max_length=100, description="Должность")
    email: Optional[EmailStr] = Field(None, description="Email сотрудника")
    telegram: Optional[str] = Field(None, max_length=100, description="Telegram username")
    is_active: Optional[bool] = Field(None, description="Активен ли сотрудник")
    notes: Optional[str] = Field(None, max_length=5000, description="Заметки")
    
    @field_validator('telegram')
    @classmethod
    def validate_telegram(cls, v: Optional[str]) -> Optional[str]:
        if v and not v.startswith('@'):
            return f'@{v}'
        return v
    
    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v = ' '.join(v.split())
            return v.title()
        return v


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