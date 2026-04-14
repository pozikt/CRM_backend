from sqlalchemy.orm import Session
from app.models.call import Call
from app.schemas.call import CallCreate, CallUpdate

def get_calls(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Call).order_by(Call.scheduled_datetime.desc()).offset(skip).limit(limit).all()

def get_call(db: Session, call_id: int):
    return db.query(Call).filter(Call.id == call_id).first()

def create_call(db: Session, call: CallCreate):
    db_call = Call(**call.model_dump())
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call

def update_call(db: Session, call_id: int, call_update: CallUpdate):
    db_call = get_call(db, call_id)
    if not db_call:
        return None
    update_data = call_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_call, field, value)
    db.commit()
    db.refresh(db_call)
    return db_call

def delete_call(db: Session, call_id: int):
    db_call = get_call(db, call_id)
    if not db_call:
        return False
    db.delete(db_call)
    db.commit()
    return True