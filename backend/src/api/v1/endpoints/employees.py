from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from models.employee import Employee
from models.project import Project
from schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from schemas.project import ProjectOut

router = APIRouter(prefix="/api/v1/employees", tags=["Employees"])


@router.get("", response_model=List[EmployeeOut])
def get_employees(
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by full name"),
    db: Session = Depends(get_db)
):
    """Получить список сотрудников с опциональной фильтрацией"""
    query = db.query(Employee)
    
    if role:
        query = query.filter(Employee.role == role)
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    if search:
        query = query.filter(Employee.full_name.ilike(f"%{search}%"))
    
    return query.all()


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    return db_employee


@router.get("/{employee_id}/projects", response_model=List[ProjectOut])
def get_employee_projects(employee_id: int, db: Session = Depends(get_db)):
    """Получить список проектов, где сотрудник указан как ответственный (manager_id)"""
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    projects = db.query(Project).filter(Project.manager_id == employee_id).all()
    return projects


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, employee: EmployeeUpdate, db: Session = Depends(get_db)):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    update_data = employee.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_employee, field, value)

    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    db.delete(db_employee)
    db.commit()
    return