from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut

router = APIRouter(prefix="/api/v1/employees", tags=["Employees"])


@router.get("", response_model=List[EmployeeOut])  # ← без слеша
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)  # ← без слеша
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