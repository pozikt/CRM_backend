from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine
from models import Call, Employee
from api.v1.endpoints import calls, employees

# Создаём таблицы
Call.metadata.create_all(bind=engine)
Employee.metadata.create_all(bind=engine)

app = FastAPI(title="CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # ваш фронтенд
        "http://127.0.0.1:5173",
        "http://localhost:5000",   # прокси (если используете)
        "http://127.0.0.1:5000",
        "*"  # временно разрешить все (только для разработки)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calls.router)
app.include_router(employees.router)

@app.get("/")
def root():
    return {"message": "CRM API работает", "docs": "/docs"}