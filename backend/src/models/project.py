from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from core.database import Base
import datetime

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status_id = Column(Integer, ForeignKey("statuses.id"), nullable=False)
    priority_id = Column(Integer, ForeignKey("priorities.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    start_date = Column(DateTime, nullable=True)
    deadline_date = Column(DateTime, nullable=True)
    progress = Column(Float, default=0)
    client_name = Column(String(255), nullable=True)
    client_contact = Column(String(255), nullable=True)
    tags = Column(Text, nullable=True)  # JSON или CSV
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Связи
    status = relationship("Status", back_populates="projects")
    priority = relationship("Priority", back_populates="projects")
    manager = relationship("Employee", back_populates="managed_projects")