from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import Base, engine
from api.v1.endpoints import calls, employees, utils, projects, priorities, statuses
from csv_manager.router import router as csv_router

# Создаём все таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для разработки ок, потом можно сузить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
