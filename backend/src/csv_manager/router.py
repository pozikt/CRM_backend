import csv
from io import StringIO
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from core.database import get_db
from models.project import Project
from models.status import Status
from models.priority import Priority
from schemas.project import ProjectCreate
from crud.project import create_project
from .validator import ProjectCSVValidator

router = APIRouter(prefix="/csv", tags=["CSV Import/Export"])

@router.get("/export")
async def export_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Заголовки
    writer.writerow(["name", "description", "status", "priority", "progress", "client_name"])
    
    for p in projects:
        writer.writerow([
            p.name, 
            p.description or "", 
            p.status.name if p.status else "", 
            p.priority.name if p.priority else "", 
            p.progress, 
            p.client_name or ""
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=projects_export.csv"}
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
    
    count = 0
    errors = []
    for i, row in enumerate(reader, start=2):
        try:
            # Пытаемся найти ID или используем дефолтный (1)
            status_id = statuses_lower.get(row.get("status", "").lower(), 1)
            priority_id = priorities_lower.get(row.get("priority", "").lower(), 1)
            
            new_project_data = ProjectCreate(
                name=row.get("name", "Unnamed Project"),
                description=row.get("description", ""),
                status_id=status_id,
                priority_id=priority_id,
                progress=float(row.get("progress", 0)) if row.get("progress") else 0.0,
                client_name=row.get("client_name", ""),
                start_date=None
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
