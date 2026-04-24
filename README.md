# CRM System - Инструкция по запуску

Проект полностью упакован в Docker. Для запуска нужен только Docker и Docker Compose.

## Требования

- Docker (с Docker Compose)
- Git (для клонирования)

## Быстрый старт

1. Клонируйте репозиторий:
   git clone https://github.com/pozikt/CRM_backend.git
   cd CRM_backend
   git checkout refactor/docker

2. Создайте файл .env в корне проекта:
   cp .env.example .env
   При необходимости отредактируйте пароли внутри .env.

3. Запустите проект одной командой:
   docker-compose up -d --build

4. Дождитесь готовности (около 10 секунд).

## Доступ к приложению

Фронтенд: http://localhost
API (Swagger): http://localhost:8000/docs

## Первоначальная настройка

Перед созданием первого проекта необходимо добавить статусы и приоритеты через Swagger:

1. Откройте http://localhost:8000/docs
2. Выполните POST /api/v1/statuses с телом:
   { "name": "В работе" }
   Повторите для нужных статусов ("Завершён", "Приостановлен", "На рассмотрении")
3. Выполните POST /api/v1/priorities с телом:
   { "name": "Высокий", "color": "#FF0000", "order": 1 }
   Аналогично добавьте "Средний", "Низкий", "Срочный"

Теперь можно создавать проекты через интерфейс: Admin panel -> Add a project

## Остановка и очистка

Остановить контейнеры:
docker-compose down

Полная очистка (удаляет все данные БД!):
docker-compose down -v

## Структура (кратко)

- backend/ – FastAPI + SQLAlchemy + PostgreSQL
- frontend/ – статика (HTML/CSS/JS) + Nginx
- docker-compose.yml – оркестрация сервисов

## Разработка без Docker

Бэкенд:
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload

Фронтенд: открыть frontend/public/index.html в браузере

## Импорт/экспорт

Сейчас работает только через Swagger
