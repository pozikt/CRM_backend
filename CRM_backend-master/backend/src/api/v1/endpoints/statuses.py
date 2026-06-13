from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.status import Status
from schemas.status import StatusCreate, StatusUpdate, StatusOut

router = APIRouter(prefix="/api/v1/statuses", tags=["Statuses"])

@router.get("", response_model=List[StatusOut])
def read_statuses(db: Session = Depends(get_db)):
    return db.query(Status).all()

@router.post("", response_model=StatusOut, status_code=status.HTTP_201_CREATED)
def create_status(status_data: StatusCreate, db: Session = Depends(get_db)):
    db_status = Status(**status_data.model_dump())
    db.add(db_status)
    db.commit()
    db.refresh(db_status)
    return db_status

@router.get("/{status_id}", response_model=StatusOut)
def read_status(status_id: int, db: Session = Depends(get_db)):
    db_status = db.query(Status).filter(Status.id == status_id).first()
    if not db_status:
        raise HTTPException(status_code=404, detail="Status not found")
    return db_status

@router.put("/{status_id}", response_model=StatusOut)
def update_status(status_id: int, status_update: StatusUpdate, db: Session = Depends(get_db)):
    db_status = db.query(Status).filter(Status.id == status_id).first()
    if not db_status:
        raise HTTPException(status_code=404, detail="Status not found")
    update_data = status_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_status, field, value)
    db.commit()
    db.refresh(db_status)
    return db_status

@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_status(status_id: int, db: Session = Depends(get_db)):
    db_status = db.query(Status).filter(Status.id == status_id).first()
    if not db_status:
        raise HTTPException(status_code=404, detail="Status not found")
    db.delete(db_status)
    db.commit()
    return