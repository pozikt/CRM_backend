import csv
from io import StringIO
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Response
from sqlalchemy.orm import Session
from core.database import get_db
from models.project import Project, ProjectEmployee
from models.employee import Employee
from models.call import Call, CallParticipant
from models.status import Status
from models.priority import Priority
from schemas.project import ProjectCreate
from crud.project import create_project
from .validator import ProjectCSVValidator

router = APIRouter(prefix="/csv", tags=["CSV Import/Export"])

@router.get("/export")
async def export_projects(db: Session = Depends(get_db)):
    """
    Экспортирует все проекты с полной информацией:
    - Основные поля проекта
    - Контакт клиента
    - Менеджер
    - Даты и теги
    - Список участников проекта
    - Информация о созвонах (дата, ссылка, результат, участники)
    """
    try:
        projects = db.query(Project).all()
        
        output = StringIO()
        # Добавляем BOM для корректного отображения кириллицы в Excel
        output.write('\ufeff')
        
        writer = csv.writer(output, lineterminator='\n')
        
        # Заголовки
        writer.writerow([
            "name", "description", "status", "priority", "progress", 
            "client_name", "client_contact", "manager", "start_date", 
            "deadline_date", "tags", "employees", "calls_info"
        ])
        
        for p in projects:
            try:
                # Безопасное получение менеджера
                manager_name = p.manager.full_name if p.manager else ""
                
                # Безопасное получение участников проекта
                employees_list = []
                if p.employees:
                    for pe in p.employees:
                        if pe.employee:
                            employees_list.append(f"{pe.employee.full_name} ({pe.employee.role})")
                employees_str = "; ".join(employees_list) if employees_list else ""
                
                # Форматирование дат
                start_date_str = p.start_date.strftime("%Y-%m-%d") if p.start_date else ""
                deadline_str = p.deadline_date.strftime("%Y-%m-%d") if p.deadline_date else ""
                
                # Информация о созвонах
                calls_list = []
                if p.calls:
                    for call in p.calls:
                        call_dt = call.scheduled_datetime.strftime("%Y-%m-%d %H:%M") if call.scheduled_datetime else "N/A"
                        
                        call_participants = []
                        if call.participants:
                            for cp in call.participants:
                                if cp.employee:
                                    call_participants.append(cp.employee.full_name)
                        participants_str = ", ".join(call_participants)
                        
                        call_info = (
                            f"[{call_dt}] {call.title or 'Call'}: "
                            f"Link: {call.meeting_link or 'N/A'}, "
                            f"Result: {call.result or 'No result'}, "
                            f"Participants: {participants_str}"
                        )
                        calls_list.append(call_info)
                calls_info_str = " | ".join(calls_list) if calls_list else ""
                
                writer.writerow([
                    p.name,
                    p.description or "",
                    p.status.name if p.status else "",
                    p.priority.name if p.priority else "",
                    p.progress or 0,
                    p.client_name or "",
                    p.client_contact or "",
                    manager_name,
                    start_date_str,
                    deadline_str,
                    p.tags or "",
                    employees_str,
                    calls_info_str
                ])
            except Exception as e:
                print(f"Error exporting project {getattr(p, 'id', 'unknown')}: {e}")
                continue
        
        content = output.getvalue()
        output.close()
        
        return Response(
            content=content,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=projects_export.csv",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        print(f"Global export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate")
async def validate_projects(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    statuses = {s.name: s.id for s in db.query(Status).all()}
    priorities = {p.name: p.id for p in db.query(Priority).all()}
    
    validator = ProjectCSVValidator(statuses, priorities)
    is_valid, result = validator.validate_file(decoded)
    
    return result

@router.post("/import")
async def import_projects(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    statuses = {s.name: s.id for s in db.query(Status).all()}
    priorities = {p.name: p.id for p in db.query(Priority).all()}
    
    validator = ProjectCSVValidator(statuses, priorities)
    is_valid, validation_result = validator.validate_file(decoded)
    
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"CSV validation failed. Errors: {validation_result['errors'][:5]}"
        )
    
    reader = csv.DictReader(StringIO(decoded))
    statuses_lower = {s.lower(): sid for s, sid in statuses.items()}
    priorities_lower = {p.lower(): pid for p, pid in priorities.items()}
    employees_by_name = {e.full_name: e.id for e in db.query(Employee).all()}
    
    count = 0
    errors = []
    for i, row in enumerate(reader, start=2):
        try:
            status_id = statuses_lower.get(row.get("status", "").lower(), 1)
            priority_id = priorities_lower.get(row.get("priority", "").lower(), 1)
            
            manager_name = row.get("manager", "").strip()
            manager_id = employees_by_name.get(manager_name) if manager_name else None
            
            start_date = None
            start_date_str = row.get("start_date", "").strip()
            if start_date_str:
                try:
                    from datetime import datetime
                    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
                except:
                    pass
            
            deadline_date = None
            deadline_str = row.get("deadline_date", "").strip()
            if deadline_str:
                try:
                    from datetime import datetime
                    deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d")
                except:
                    pass
            
            employee_ids = []
            employees_str = row.get("employees", "").strip()
            if employees_str:
                for emp_entry in employees_str.split(";"):
                    emp_entry = emp_entry.strip()
                    if emp_entry:
                        emp_name = emp_entry.split("(")[0].strip()
                        emp_id = employees_by_name.get(emp_name)
                        if emp_id:
                            employee_ids.append(emp_id)
            
            new_project_data = ProjectCreate(
                name=row.get("name", "Unnamed Project"),
                description=row.get("description", ""),
                status_id=status_id,
                priority_id=priority_id,
                manager_id=manager_id,
                progress=float(row.get("progress", 0)) if row.get("progress") else 0.0,
                client_name=row.get("client_name", ""),
                client_contact=row.get("client_contact", ""),
                tags=row.get("tags", ""),
                start_date=start_date,
                deadline_date=deadline_date,
                employee_ids=employee_ids
            )
            create_project(db, new_project_data)
            count += 1
        except Exception as e:
            error_msg = f"Row {i}: {str(e)}"
            print(f"Error importing row: {error_msg}")
            errors.append(error_msg)
            continue
        
    return {
        "status": "success" if count > 0 else "failed", 
        "imported": count,
        "total_rows": count + len(errors),
        "errors": errors[:10]
    }
