from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from core.database import get_db
from models.call import Call, CallParticipant, CallStatus
from models.project import Project
from models.employee import Employee
from schemas.call import CallCreate, CallUpdate, CallOut

router = APIRouter(prefix="/api/v1/calls", tags=["Calls"])


@router.get("", response_model=List[CallOut])
def get_calls(
    project_id: Optional[int] = Query(None),
    status: Optional[CallStatus] = Query(None),
    employee_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Call).options(
        joinedload(Call.project),
        joinedload(Call.participants).joinedload(CallParticipant.employee)
    )
    
    if project_id:
        query = query.filter(Call.project_id == project_id)
    if status:
        query = query.filter(Call.status == status)
    if employee_id:
        query = query.join(Call.participants).filter(CallParticipant.employee_id == employee_id)
    
    calls = query.order_by(Call.scheduled_datetime.desc()).offset(skip).limit(limit).all()
    
    # Преобразуем datetime в строку для ответа
    result = []
    for call in calls:
        call_dict = {
            'id': call.id,
            'project_id': call.project_id,
            'title': call.title,  # <-- ДОБАВЛЕНО
            'scheduled_datetime': call.scheduled_datetime.strftime('%d.%m.%Y %H:%M'),
            'duration_minutes': call.duration_minutes,
            'meeting_link': call.meeting_link,
            'result': call.result,
            'status': call.status,
            'created_at': call.created_at.strftime('%d.%m.%Y %H:%M') if call.created_at else None,
            'updated_at': call.updated_at.strftime('%d.%m.%Y %H:%M') if call.updated_at else None,
            'project': call.project,
            'participants': call.participants
        }
        result.append(call_dict)
    
    return result


@router.post("", response_model=CallOut, status_code=status.HTTP_201_CREATED)
def create_call(call: CallCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == call.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    # Преобразуем строку в datetime
    scheduled_datetime = datetime.strptime(call.scheduled_datetime, '%d.%m.%Y %H:%M')
    
    db_call = Call(
        project_id=call.project_id,
        title=call.title,  # <-- ДОБАВЛЕНО
        scheduled_datetime=scheduled_datetime,
        duration_minutes=call.duration_minutes,
        meeting_link=call.meeting_link,
        result=call.result,
        status=call.status
    )
    db.add(db_call)
    db.flush()
    
    for emp_id in call.participant_ids:
        employee = db.query(Employee).filter(Employee.id == emp_id).first()
        if employee:
            participant = CallParticipant(call_id=db_call.id, employee_id=emp_id)
            db.add(participant)
    
    db.commit()
    db.refresh(db_call)
    
    # Формируем ответ
    return {
        'id': db_call.id,
        'project_id': db_call.project_id,
        'title': db_call.title,  # <-- ДОБАВЛЕНО
        'scheduled_datetime': db_call.scheduled_datetime.strftime('%d.%m.%Y %H:%M'),
        'duration_minutes': db_call.duration_minutes,
        'meeting_link': db_call.meeting_link,
        'result': db_call.result,
        'status': db_call.status,
        'created_at': db_call.created_at.strftime('%d.%m.%Y %H:%M'),
        'updated_at': db_call.updated_at.strftime('%d.%m.%Y %H:%M'),
        'project': db_call.project,
        'participants': db_call.participants
    }


@router.get("/{call_id}", response_model=CallOut)
def get_call(call_id: int, db: Session = Depends(get_db)):
    db_call = db.query(Call).options(
        joinedload(Call.project),
        joinedload(Call.participants).joinedload(CallParticipant.employee)
    ).filter(Call.id == call_id).first()
    if not db_call:
        raise HTTPException(status_code=404, detail="Созвон не найден")
    
    return {
        'id': db_call.id,
        'project_id': db_call.project_id,
        'title': db_call.title,  # <-- ДОБАВЛЕНО
        'scheduled_datetime': db_call.scheduled_datetime.strftime('%d.%m.%Y %H:%M'),
        'duration_minutes': db_call.duration_minutes,
        'meeting_link': db_call.meeting_link,
        'result': db_call.result,
        'status': db_call.status,
        'created_at': db_call.created_at.strftime('%d.%m.%Y %H:%M'),
        'updated_at': db_call.updated_at.strftime('%d.%m.%Y %H:%M'),
        'project': db_call.project,
        'participants': db_call.participants
    }


@router.put("/{call_id}", response_model=CallOut)
def update_call(call_id: int, call: CallUpdate, db: Session = Depends(get_db)):
    db_call = db.query(Call).filter(Call.id == call_id).first()
    if not db_call:
        raise HTTPException(status_code=404, detail="Созвон не найден")
    
    # Обновляем поля
    if call.project_id is not None:
        db_call.project_id = call.project_id
    if call.title is not None:  # <-- ДОБАВЛЕНО
        db_call.title = call.title
    if call.scheduled_datetime is not None:
        db_call.scheduled_datetime = datetime.strptime(call.scheduled_datetime, '%d.%m.%Y %H:%M')
    if call.duration_minutes is not None:
        db_call.duration_minutes = call.duration_minutes
    if call.meeting_link is not None:
        db_call.meeting_link = call.meeting_link
    if call.result is not None:
        db_call.result = call.result
    if call.status is not None:
        db_call.status = call.status
    
    # Обновляем участников
    if call.participant_ids is not None:
        db.query(CallParticipant).filter(CallParticipant.call_id == call_id).delete()
        for emp_id in call.participant_ids:
            employee = db.query(Employee).filter(Employee.id == emp_id).first()
            if employee:
                participant = CallParticipant(call_id=db_call.id, employee_id=emp_id)
                db.add(participant)
    
    db.commit()
    db.refresh(db_call)
    
    return {
        'id': db_call.id,
        'project_id': db_call.project_id,
        'title': db_call.title,  # <-- ДОБАВЛЕНО
        'scheduled_datetime': db_call.scheduled_datetime.strftime('%d.%m.%Y %H:%M'),
        'duration_minutes': db_call.duration_minutes,
        'meeting_link': db_call.meeting_link,
        'result': db_call.result,
        'status': db_call.status,
        'created_at': db_call.created_at.strftime('%d.%m.%Y %H:%M'),
        'updated_at': db_call.updated_at.strftime('%d.%m.%Y %H:%M'),
        'project': db_call.project,
        'participants': db_call.participants
    }


@router.patch("/{call_id}/status", response_model=CallOut)
def update_call_status(call_id: int, status_data: dict, db: Session = Depends(get_db)):
    db_call = db.query(Call).filter(Call.id == call_id).first()
    if not db_call:
        raise HTTPException(status_code=404, detail="Созвон не найден")
    
    new_status = status_data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Не указан статус")
    
    try:
        db_call.status = CallStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный статус")
    
    db.commit()
    db.refresh(db_call)
    
    return {
        'id': db_call.id,
        'project_id': db_call.project_id,
        'title': db_call.title,  # <-- ДОБАВЛЕНО
        'scheduled_datetime': db_call.scheduled_datetime.strftime('%d.%m.%Y %H:%M'),
        'duration_minutes': db_call.duration_minutes,
        'meeting_link': db_call.meeting_link,
        'result': db_call.result,
        'status': db_call.status,
        'created_at': db_call.created_at.strftime('%d.%m.%Y %H:%M'),
        'updated_at': db_call.updated_at.strftime('%d.%m.%Y %H:%M'),
        'project': db_call.project,
        'participants': db_call.participants
    }


@router.delete("/{call_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_call(call_id: int, db: Session = Depends(get_db)):
    db_call = db.query(Call).filter(Call.id == call_id).first()
    if not db_call:
        raise HTTPException(status_code=404, detail="Созвон не найден")
    db.delete(db_call)
    db.commit()
    return