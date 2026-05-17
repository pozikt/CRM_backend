import csv
from io import StringIO
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from core.database import get_db
from models.project import Project, ProjectEmployee
from models.employee import Employee
from models.call import Call
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
    - Название, описание, статус, приоритет
    - Прогресс, затраченные часы
    - Клиент и контакт клиента
    - Менеджер (ответственный)
    - Дата начала и дедлайн
    - Теги
    - Список участников проекта
    """
    projects = db.query(Project).all()
    
    output = StringIO()
    # Используем lineterminator='\n' для консистентности
    writer = csv.writer(output, lineterminator='\n')
    
    # Заголовки
    writer.writerow([
        "name", "description", "status", "priority", "progress", "hours", 
        "client_name", "client_contact", "manager", "start_date", 
        "deadline_date", "tags", "employees", "calls_info"
    ])
    
    for p in projects:
        try:
            # Получаем имя менеджера
            manager_name = ""
            try:
                if p.manager:
                    manager_name = p.manager.full_name
            except:
                pass
            
            # Получаем список участников проекта
            employees_list = []
            try:
                if p.employees:
                    for pe in p.employees:
                        if pe.employee:
                            employees_list.append(f"{pe.employee.full_name} ({pe.employee.role})")
            except:
                pass
            employees_str = "; ".join(employees_list) if employees_list else ""
            
            # Форматируем даты
            start_date_str = ""
            try:
                if p.start_date:
                    start_date_str = p.start_date.strftime("%Y-%m-%d")
            except:
                pass
                
            deadline_str = ""
            try:
                if p.deadline_date:
                    deadline_str = p.deadline_date.strftime("%Y-%m-%d")
            except:
                pass
            
            # Получаем информацию о созвонах
            calls_list = []
            try:
                if p.calls:
                    for call in p.calls:
                        call_dt = "N/A"
                        try:
                            if call.scheduled_datetime:
                                call_dt = call.scheduled_datetime.strftime("%Y-%m-%d %H:%M")
                        except:
                            pass
                            
                        call_participants = []
                        try:
                            if call.participants:
                                for cp in call.participants:
                                    if cp.employee:
                                        call_participants.append(cp.employee.full_name)
                        except:
                            pass
                        participants_str = ", ".join(call_participants)
                        
                        call_info = (
                            f"[{call_dt}] {call.title or 'Call'}: "
                            f"Link: {call.meeting_link or 'N/A'}, "
                            f"Result: {call.result or 'No result'}, "
                            f"Participants: {participants_str}"
                        )
                        calls_list.append(call_info)
            except:
                pass
            calls_info_str = " | ".join(calls_list) if calls_list else ""
            
            # Статус и приоритет
            status_name = ""
            try:
                if p.status:
                    status_name = p.status.name
            except:
                pass
                
            priority_name = ""
            try:
                if p.priority:
                    priority_name = p.priority.name
            except:
                pass
            
            writer.writerow([
                p.name or "Unnamed",
                p.description or "",
                status_name,
                priority_name,
                p.progress if p.progress is not None else 0,
                p.hours if p.hours is not None else 0,
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
            # Логируем ошибку, но продолжаем экспорт других проектов
            print(f"Critical error exporting project {getattr(p, 'id', 'unknown')}: {e}")
            continue
    
    content = output.getvalue()
    output.close()
    
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=projects_export.csv",
            "Cache-Control": "no-cache"
        }
    )

@router.post("/validate")
async def validate_projects(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Валидация CSV-файла перед импортом.
    
    Проверяет:
    - Формат файла (должен быть CSV)
    - Наличие обязательных колонок
    - Корректность данных в каждой строке
    - Соответствие значений справочникам (статусы, приоритеты)
    
    Returns:
        - is_valid: bool - валиден ли файл
        - stats: dict - статистика (всего строк, валидных, с ошибками)
        - errors: list - список ошибок валидации
        - warnings: list - список предупреждений
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Получаем доступные статусы и приоритеты
    statuses = {s.name: s.id for s in db.query(Status).all()}
    priorities = {p.name: p.id for p in db.query(Priority).all()}
    
    # Создаём валидатор и проводим валидацию
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
    
    # Получаем доступные статусы и приоритеты
    statuses = {s.name: s.id for s in db.query(Status).all()}
    priorities = {p.name: p.id for p in db.query(Priority).all()}
    
    # Валидируем файл перед импортом
    validator = ProjectCSVValidator(statuses, priorities)
    is_valid, validation_result = validator.validate_file(decoded)
    
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"CSV validation failed. Errors: {validation_result['errors'][:5]}"
        )
    
    # Если валидация прошла, начинаем импорт
    reader = csv.DictReader(StringIO(decoded))
    
    # Кэшируем справочники (преобразуем в нижний регистр для поиска)
    statuses_lower = {s.lower(): sid for s, sid in statuses.items()}
    priorities_lower = {p.lower(): pid for p, pid in priorities.items()}
    
    # Кэшируем сотрудников для привязки
    employees_by_name = {e.full_name: e.id for e in db.query(Employee).all()}
    
    count = 0
    errors = []
    for i, row in enumerate(reader, start=2):
        try:
            # Пытаемся найти ID или используем дефолтный (1)
            status_id = statuses_lower.get(row.get("status", "").lower(), 1)
            priority_id = priorities_lower.get(row.get("priority", "").lower(), 1)
            
            # Получаем ID менеджера по имени
            manager_name = row.get("manager", "").strip()
            manager_id = employees_by_name.get(manager_name) if manager_name else None
            
            # Парсим дату начала
            start_date = None
            start_date_str = row.get("start_date", "").strip()
            if start_date_str:
                try:
                    from datetime import datetime
                    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
                except:
                    pass
            
            # Парсим дедлайн
            deadline_date = None
            deadline_str = row.get("deadline_date", "").strip()
            if deadline_str:
                try:
                    from datetime import datetime
                    deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d")
                except:
                    pass
            
            # Парсим список участников (формат: "Name1 (Role1); Name2 (Role2)")
            employee_ids = []
            employees_str = row.get("employees", "").strip()
            if employees_str:
                for emp_entry in employees_str.split(";"):
                    emp_entry = emp_entry.strip()
                    if emp_entry:
                        # Извлекаем имя (до скобки)
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
        "errors": errors[:10] # Возвращаем первые 10 ошибок для диагностики
    }
