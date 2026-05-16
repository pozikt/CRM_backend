from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from core.database import Base
import datetime
import enum

class CallStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    scheduled_datetime = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    meeting_link = Column(String(512), nullable=True)
    result = Column(Text, nullable=True)
    status = Column(SQLEnum(CallStatus), default=CallStatus.SCHEDULED)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="calls")
    participants = relationship("CallParticipant", back_populates="call", cascade="all, delete-orphan")


class CallParticipant(Base):
    __tablename__ = "call_participants"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    call = relationship("Call", back_populates="participants")
    employee = relationship("Employee")