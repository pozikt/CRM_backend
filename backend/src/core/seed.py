import os

from sqlalchemy.orm import Session

from core.auth import hash_password
from core.database import SessionLocal
from models.user import User


def seed_default_admin() -> None:
    login = os.getenv("DEFAULT_ADMIN_LOGIN", "admin")
    password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
    email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@crm.local")

    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        user = User(
            username=login,
            email=email,
            password_hash=hash_password(password),
            full_name="Administrator",
        )
        db.add(user)
        db.commit()
    finally:
        db.close()
