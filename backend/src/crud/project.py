from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from models.project import Project
from schemas.project import ProjectCreate, ProjectUpdate
from datetime import datetime

def get_projects(db: Session, skip: int = 0, limit: int = 100, status: int = None, priority: int = None, manager_id: int = None, search: str = None):
    """
    Получить список проектов с опциональной фильтрацией и поиском
    """
    query = db.query(Project)
    
    if status is not None:
        query = query.filter(Project.status_id == status)
    if priority is not None:
        query = query.filter(Project.priority_id == priority)
    if manager_id is not None:
        query = query.filter(Project.manager_id == manager_id)
    if search is not None and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Project.name.ilike(search_term),
                Project.client_name.ilike(search_term),
                Project.description.ilike(search_term)
            )
        )
    
    return query.offset(skip).limit(limit).all()

def get_project(db: Session, project_id: int):
    """
    Получить проект по ID
    """
    return db.query(Project).filter(Project.id == project_id).first()

def create_project(db: Session, project: ProjectCreate):
    """
    Создать новый проект
    """
    db_project = Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: int, project_update: ProjectUpdate):
    """
    Обновить проект
    """
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    """
    Удалить проект
    """
    db_project = get_project(db, project_id)
    if not db_project:
        return False
    db.delete(db_project)
    db.commit()
    return True

def get_projects_by_status(db: Session, status_id: int, skip: int = 0, limit: int = 100):
    """
    Получить проекты с определенным статусом
    """
    return db.query(Project).filter(Project.status_id == status_id).offset(skip).limit(limit).all()

def get_projects_by_priority(db: Session, priority_id: int, skip: int = 0, limit: int = 100):
    """
    Получить проекты с определенным приоритетом
    """
    return db.query(Project).filter(Project.priority_id == priority_id).offset(skip).limit(limit).all()

def get_projects_by_manager(db: Session, manager_id: int, skip: int = 0, limit: int = 100):
    """
    Получить проекты, назначенные конкретному менеджеру
    """
    return db.query(Project).filter(Project.manager_id == manager_id).offset(skip).limit(limit).all()

def update_project_status(db: Session, project_id: int, status_id: int):
    """
    Обновить статус проекта
    """
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    db_project.status_id = status_id
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project_priority(db: Session, project_id: int, priority_id: int):
    """
    Обновить приоритет проекта
    """
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    db_project.priority_id = priority_id
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project_manager(db: Session, project_id: int, manager_id: int):
    """
    Назначить или изменить менеджера проекта
    """
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    db_project.manager_id = manager_id
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project_progress(db: Session, project_id: int, progress: float):
    """
    Обновить процент выполнения проекта
    """
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    db_project.progress = progress
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project_hours(db: Session, project_id: int, hours: float):
    """
    Обновить затраченные часы на проект
    """
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    # Добавляем часы к существующему значению или создаем новое поле
    # Предполагаем, что есть поле hours в модели
    if hasattr(db_project, 'hours'):
        db_project.hours = hours
    db.commit()
    db.refresh(db_project)
    return db_project

def search_projects(db: Session, text: str, skip: int = 0, limit: int = 100):
    """
    Поиск проектов по названию или названию клиента
    """
    return db.query(Project).filter(
        or_(
            Project.name.ilike(f"%{text}%"),
            Project.client_name.ilike(f"%{text}%")
        )
    ).offset(skip).limit(limit).all()

def get_projects_by_deadline(db: Session, date_str: str, skip: int = 0, limit: int = 100):
    """
    Получить проекты с дедлайном от указанной даты
    """
    try:
        deadline_date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return []
    
    return db.query(Project).filter(
        Project.deadline_date >= deadline_date
    ).offset(skip).limit(limit).all()

def get_project_meetings(db: Session, project_id: int):
    """
    Получить список совещаний/встреч проекта
    """
    # Это может быть связано с таблицей calls/meetings
    # Возвращаем структурированный ответ
    return {
        "project_id": project_id,
        "meetings": []
    }

def get_project_summary(db: Session, project_id: int):
    """
    Получить сводку проекта
    """
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    
    return {
        "id": db_project.id,
        "name": db_project.name,
        "status": db_project.status.name if db_project.status else None,
        "priority": db_project.priority.name if db_project.priority else None,
        "manager": db_project.manager.full_name if db_project.manager else None,
        "progress": db_project.progress,
        "start_date": db_project.start_date,
        "deadline_date": db_project.deadline_date,
        "client_name": db_project.client_name,
        "description": db_project.description
    }

def get_project_timeline(db: Session, project_id: int):
    """
    Получить таймлайн проекта
    """
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    
    return {
        "project_id": project_id,
        "start_date": db_project.start_date,
        "deadline_date": db_project.deadline_date,
        "created_at": db_project.created_at,
        "updated_at": db_project.updated_at,
        "events": []
    }
