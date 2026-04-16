from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.priority import Priority
from schemas.priority import PriorityCreate, PriorityUpdate, PriorityOut

router = APIRouter(prefix="/api/v1/priorities", tags=["Priorities"])

@router.get("", response_model=List[PriorityOut])
def read_priorities(db: Session = Depends(get_db)):
    return db.query(Priority).all()

@router.post("", response_model=PriorityOut, status_code=status.HTTP_201_CREATED)
def create_priority(priority_data: PriorityCreate, db: Session = Depends(get_db)):
    db_priority = Priority(**priority_data.model_dump())
    db.add(db_priority)
    db.commit()
    db.refresh(db_priority)
    return db_priority

@router.get("/{priority_id}", response_model=PriorityOut)
def read_priority(priority_id: int, db: Session = Depends(get_db)):
    db_priority = db.query(Priority).filter(Priority.id == priority_id).first()
    if not db_priority:
        raise HTTPException(status_code=404, detail="Priority not found")
    return db_priority

@router.put("/{priority_id}", response_model=PriorityOut)
def update_priority(priority_id: int, priority_update: PriorityUpdate, db: Session = Depends(get_db)):
    db_priority = db.query(Priority).filter(Priority.id == priority_id).first()
    if not db_priority:
        raise HTTPException(status_code=404, detail="Priority not found")
    update_data = priority_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_priority, field, value)
    db.commit()
    db.refresh(db_priority)
    return db_priority

@router.delete("/{priority_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_priority(priority_id: int, db: Session = Depends(get_db)):
    db_priority = db.query(Priority).filter(Priority.id == priority_id).first()
    if not db_priority:
        raise HTTPException(status_code=404, detail="Priority not found")
    db.delete(db_priority)
    db.commit()
    return