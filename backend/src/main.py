from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import Base, engine
from core.migrations import run_migrations
from core.middleware import AuthMiddleware
from core.seed import seed_default_admin
from api.v1.endpoints import auth, calls, employees, utils, projects, priorities, statuses
from csv_manager.router import router as csv_router
import models  # noqa: F401 — register all SQLAlchemy models before create_all

# Обновляем схему и создаём недостающие таблицы
run_migrations(engine)
Base.metadata.create_all(bind=engine)
seed_default_admin()

app = FastAPI(title="CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для разработки ок, потом можно сузить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)

app.include_router(auth.router)
app.include_router(calls.router)
app.include_router(employees.router)
app.include_router(utils.router)
app.include_router(projects.router)
app.include_router(priorities.router)
app.include_router(statuses.router)
app.include_router(csv_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "CRM API работает", "docs": "/docs"}
