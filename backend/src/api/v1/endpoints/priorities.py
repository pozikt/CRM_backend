from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.priority import Priority
from schemas.priority import PriorityCreate, PriorityOut

router = APIRouter(prefix="/api/v1/priorities", tags=["Priorities"])

@router.get("", response_model=List[PriorityOut])
def read_priorities(db: Session = Depends(get_db)):
    return db.query(Priority).all()

@router.post("", response_model=PriorityOut, status_code=201)
def create_priority(priority: PriorityCreate, db: Session = Depends(get_db)):
    db_priority = Priority(**priority.model_dump())
    db.add(db_priority)
    db.commit()
    db.refresh(db_priority)
    return db_priority