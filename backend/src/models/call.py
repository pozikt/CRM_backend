from sqlalchemy import Column, Integer, String, DateTime
from core.database import Base

class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    scheduled_datetime = Column(DateTime(timezone=True), nullable=False)
    meeting_link = Column(String(512), nullable=True)