import csv
from io import StringIO
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from core.database import get_db
from models.project import Project
from models.status import Status
from models.priority import Priority
from schemas.project import ProjectCreate
from crud.project import create_project

router = APIRouter(prefix="/csv", tags=["CSV Import/Export"])

def get_default_status_id(db: Session) -> int:
    default_status = db.query(Status).filter(Status.is_default == True).first()
    if default_status:
        return default_status.id
    # Fallback to the first status if no default is explicitly set
    first_status = db.query(Status).first()
    return first_status.id if first_status else 1 # Default to 1 if no statuses exist

def get_default_priority_id(db: Session) -> int:
    # For priority, we'll just use the first one as a default if no match
    first_priority = db.query(Priority).order_by(Priority.order).first()
    return first_priority.id if first_priority else 1 # Default to 1 if no priorities exist

@router.get("/export")
async def export_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Заголовки: Добавляем все поля из модели Project
    writer.writerow([
        "id", "name", "description", "status", "priority", "manager_id", 
        "start_date", "deadline_date", "progress", "client_name", 
        "client_contact", "tags", "created_at", "updated_at"
    ])
    
    for p in projects:
        writer.writerow([
            p.id,
            p.name,
            p.description or "",
            p.status.name if p.status else "",
            p.priority.name if p.priority else "",
            p.manager_id or "",
            p.start_date.isoformat() if p.start_date else "",
            p.deadline_date.isoformat() if p.deadline_date else "",
            p.progress,
            p.client_name or "",
            p.client_contact or "",
            p.tags or "",
            p.created_at.isoformat() if p.created_at else "",
            p.updated_at.isoformat() if p.updated_at else ""
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=projects_export.csv"}
    )

@router.post("/import")
async def import_projects(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a CSV")
        
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(StringIO(decoded))
    
    # Кэшируем справочники и получаем дефолтные ID
    statuses = {s.name.lower(): s.id for s in db.query(Status).all()}
    priorities = {p.name.lower(): p.id for p in db.query(Priority).all()}
    default_status_id = get_default_status_id(db)
    default_priority_id = get_default_priority_id(db)
    
    count = 0
    errors = []
    for i, row in enumerate(reader):
        row_num = i + 1
        try:
            # Валидация и преобразование данных
            name = row.get("name")
            if not name:
                raise ValueError("Project name is required")
            
            description = row.get("description", "")
            
            status_name = row.get("status", "").lower()
            status_id = statuses.get(status_name, default_status_id)
            if status_id == default_status_id and status_name and status_name not in statuses:
                errors.append(f"Row {row_num}: Invalid status '{row.get('status')}', using default.")

            priority_name = row.get("priority", "").lower()
            priority_id = priorities.get(priority_name, default_priority_id)
            if priority_id == default_priority_id and priority_name and priority_name not in priorities:
                errors.append(f"Row {row_num}: Invalid priority '{row.get('priority')}', using default.")

            manager_id = None
            if row.get("manager_id"):
                try:
                    manager_id = int(row["manager_id"])
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid manager_id '{row.get('manager_id')}', skipping.")
                    continue # Skip row if manager_id is invalid

            progress = 0.0
            if row.get("progress"):
                try:
                    progress = float(row["progress"])
                    if not (0 <= progress <= 100):
                        raise ValueError("Progress must be between 0 and 100")
                except ValueError as ve:
                    errors.append(f"Row {row_num}: Invalid progress '{row.get('progress')}': {ve}, defaulting to 0.0.")
                    progress = 0.0
            
            client_name = row.get("client_name", "")
            client_contact = row.get("client_contact", "")
            tags = row.get("tags", "")

            start_date = None
            if row.get("start_date"):
                try:
                    start_date = datetime.fromisoformat(row["start_date"])
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid start_date format '{row.get('start_date')}', expected ISO format (YYYY-MM-DDTHH:MM:SS), skipping.")
                    continue # Skip row if start_date is invalid

            deadline_date = None
            if row.get("deadline_date"):
                try:
                    deadline_date = datetime.fromisoformat(row["deadline_date"])
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid deadline_date format '{row.get('deadline_date')}', expected ISO format (YYYY-MM-DDTHH:MM:SS), skipping.")
                    continue # Skip row if deadline_date is invalid

            new_project_data = ProjectCreate(
                name=name,
                description=description,
                status_id=status_id,
                priority_id=priority_id,
                manager_id=manager_id,
                start_date=start_date,
                deadline_date=deadline_date,
                progress=progress,
                client_name=client_name,
                client_contact=client_contact,
                tags=tags
            )
            create_project(db, new_project_data)
            count += 1
        except ValueError as ve:
            error_msg = f"Row {row_num}: {str(ve)}"
            errors.append(error_msg)
            continue
        except Exception as e:
            error_msg = f"Row {row_num}: Unexpected error - {str(e)}"
            errors.append(error_msg)
            continue
        
    return {
        "status": "success" if not errors else "partial_success" if count > 0 else "failed", 
        "imported": count,
        "total_rows_processed": i + 1,
        "errors": errors # Возвращаем все ошибки для диагностики
    }
