from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.call import Call
from schemas.call import CallCreate, CallUpdate, CallOut

router = APIRouter(prefix="/api/v1/calls", tags=["Calls"])


@router.get("", response_model=List[CallOut])
def get_calls(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    return db.query(Call).offset(skip).limit(limit).all()


@router.post("", response_model=CallOut, status_code=status.HTTP_201_CREATED)
def create_call(call: CallCreate, db: Session = Depends(get_db)):
    db_call = Call(**call.model_dump())
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call


@router.get("/{call_id}", response_model=CallOut)
def get_call(call_id: int, db: Session = Depends(get_db)):
    db_call = db.query(Call).filter(Call.id == call_id).first()
    if not db_call:
        raise HTTPException(status_code=404, detail="Созвон не найден")
    return db_call


@router.put("/{call_id}", response_model=CallOut)
def update_call(call_id: int, call: CallUpdate, db: Session = Depends(get_db)):
    db_call = db.query(Call).filter(Call.id == call_id).first()
    if not db_call:
        raise HTTPException(status_code=404, detail="Созвон не найден")

    update_data = call.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_call, field, value)

    db.commit()
    db.refresh(db_call)
    return db_call


@router.delete("/{call_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_call(call_id: int, db: Session = Depends(get_db)):
    db_call = db.query(Call).filter(Call.id == call_id).first()
    if not db_call:
        raise HTTPException(status_code=404, detail="Созвон не найден")
    db.delete(db_call)
    db.commit()
    return