from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.status import Status
from schemas.status import StatusCreate, StatusOut

router = APIRouter(prefix="/api/v1/statuses", tags=["Statuses"])

@router.get("", response_model=List[StatusOut])
def read_statuses(db: Session = Depends(get_db)):
    return db.query(Status).all()

@router.post("", response_model=StatusOut, status_code=201)
def create_status(status: StatusCreate, db: Session = Depends(get_db)):
    db_status = Status(**status.model_dump())
    db.add(db_status)
    db.commit()
    db.refresh(db_status)
    return db_status