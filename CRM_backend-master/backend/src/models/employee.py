from sqlalchemy import Column, Integer, String, Boolean, Text
from core.database import Base
from sqlalchemy.orm import relationship

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    telegram = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    managed_projects = relationship("Project", back_populates="manager")