from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from crud.project import (
    get_projects, 
    get_project, 
    create_project, 
    update_project, 
    delete_project,
    get_projects_by_status,
    get_projects_by_priority,
    get_projects_by_manager,
    update_project_status,
    update_project_priority,
    update_project_manager,
    update_project_progress,
    update_project_hours,
    search_projects,
    get_projects_by_deadline,
    get_project_meetings,
    get_project_summary,
    get_project_timeline
)
from schemas.project import ProjectCreate, ProjectUpdate, ProjectOut

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])

# GET /projects - Список проектов (зеленый)
@router.get("", response_model=List[ProjectOut])
def read_projects(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[int] = Query(None, description="Filter by status ID"),
    priority: Optional[int] = Query(None, description="Filter by priority ID"),
    responsible: Optional[int] = Query(None, description="Filter by manager ID"),
    search: Optional[str] = Query(None, description="Search by name, client or description"),
    db: Session = Depends(get_db)
):
    """
    Получить список проектов с опциональной фильтрацией по статусу, приоритету, менеджеру и поиском
    """
    return get_projects(db, skip=skip, limit=limit, status=status, priority=priority, manager_id=responsible, search=search)

# POST /projects - Создать проект (желтый)
@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_new_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """
    Создать новый проект
    """
    return create_project(db, project)

# GET /projects/{id} - Карточка проекта (зеленый)
@router.get("/{project_id}", response_model=ProjectOut)
def read_project(project_id: int, db: Session = Depends(get_db)):
    """
    Получить информацию о конкретном проекте
    """
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

# PUT /projects/{id} - Обновить проект (фиолетовый)
@router.put("/{project_id}", response_model=ProjectOut)
def update_existing_project(project_id: int, project: ProjectUpdate, db: Session = Depends(get_db)):
    """
    Обновить информацию о проекте
    """
    db_project = update_project(db, project_id, project)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

# DELETE /projects/{id} - Удалить проект (красный)
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_project(project_id: int, db: Session = Depends(get_db)):
    """
    Удалить проект
    """
    success = delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return

# PATCH /projects/{id}/status - Изменить статус (фиолетовый)
@router.patch("/{project_id}/status", response_model=ProjectOut)
def update_project_status_endpoint(project_id: int, status_id: int, db: Session = Depends(get_db)):
    """
    Обновить статус проекта
    """
    db_project = update_project_status(db, project_id, status_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

# PATCH /projects/{id}/priority - Изменить приоритет (фиолетовый)
@router.patch("/{project_id}/priority", response_model=ProjectOut)
def update_project_priority_endpoint(project_id: int, priority_id: int, db: Session = Depends(get_db)):
    """
    Обновить приоритет проекта
    """
    db_project = update_project_priority(db, project_id, priority_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

# PATCH /projects/{id}/manager - Назначить менеджера (фиолетовый)
@router.patch("/{project_id}/manager", response_model=ProjectOut)
def update_project_manager_endpoint(project_id: int, manager_id: int, db: Session = Depends(get_db)):
    """
    Назначить или изменить менеджера проекта
    """
    db_project = update_project_manager(db, project_id, manager_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

# PATCH /projects/{id}/progress - Обновить прогресс (фиолетовый)
@router.patch("/{project_id}/progress", response_model=ProjectOut)
def update_project_progress_endpoint(project_id: int, progress: float, db: Session = Depends(get_db)):
    """
    Обновить процент выполнения проекта
    """
    if not 0 <= progress <= 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
    db_project = update_project_progress(db, project_id, progress)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

# PATCH /projects/{id}/hours - Обновить затраченные часы (фиолетовый)
@router.patch("/{project_id}/hours", response_model=ProjectOut)
def update_project_hours_endpoint(project_id: int, hours: float, db: Session = Depends(get_db)):
    """
    Обновить затраченные часы на проект
    """
    db_project = update_project_hours(db, project_id, hours)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

# GET /projects/status/{id} - Фильтр проектов по статусу (зеленый)
@router.get("/status/{status_id}", response_model=List[ProjectOut])
def get_projects_by_status_endpoint(status_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить проекты с определенным статусом
    """
    return get_projects_by_status(db, status_id, skip=skip, limit=limit)

# GET /projects/priority/{id} - Фильтр проектов по приоритету (зеленый)
@router.get("/priority/{priority_id}", response_model=List[ProjectOut])
def get_projects_by_priority_endpoint(priority_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить проекты с определенным приоритетом
    """
    return get_projects_by_priority(db, priority_id, skip=skip, limit=limit)

# GET /projects/manager/{id} - Проекты конкретного менеджера (зеленый)
@router.get("/manager/{manager_id}", response_model=List[ProjectOut])
def get_projects_by_manager_endpoint(manager_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить проекты, назначенные конкретному менеджеру
    """
    return get_projects_by_manager(db, manager_id, skip=skip, limit=limit)

# GET /projects/search/{text} - Поиск по названию или клиенту (зеленый)
@router.get("/search/{text}", response_model=List[ProjectOut])
def search_projects_endpoint(text: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Поиск проектов по названию или названию клиента
    """
    return search_projects(db, text, skip=skip, limit=limit)

# GET /projects/deadline_from/{date} - Фильтр по дате дедлайна (зеленый)
@router.get("/deadline_from/{date}", response_model=List[ProjectOut])
def get_projects_by_deadline_endpoint(date: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить проекты с дедлайном от указанной даты (формат: YYYY-MM-DD)
    """
    return get_projects_by_deadline(db, date, skip=skip, limit=limit)

# GET /projects/{id}/meetings - Совещания проекта (зеленый)
@router.get("/{project_id}/meetings", response_model=dict)
def get_project_meetings_endpoint(project_id: int, db: Session = Depends(get_db)):
    """
    Получить список совещаний/встреч проекта
    """
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return get_project_meetings(db, project_id)

# GET /projects/{id}/summary - Сводка проекта (зеленый)
@router.get("/{project_id}/summary", response_model=dict)
def get_project_summary_endpoint(project_id: int, db: Session = Depends(get_db)):
    """
    Получить сводку проекта (статистика, прогресс, и т.д.)
    """
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return get_project_summary(db, project_id)

# GET /projects/{id}/timeline - Таймлайн (зеленый)
@router.get("/{project_id}/timeline", response_model=dict)
def get_project_timeline_endpoint(project_id: int, db: Session = Depends(get_db)):
    """
    Получить таймлайн проекта (ключевые события и даты)
    """
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return get_project_timeline(db, project_id)
