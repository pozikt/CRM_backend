from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.auth import (
    create_access_token,
    get_current_user,
    get_user_by_login,
    hash_password,
    verify_password,
)
from core.database import get_db
from models.user import User
from schemas.auth import TokenResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


def _username_from_email(email: str) -> str:
    base = email.split("@")[0].lower()
    return base[:100] or "user"


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    username = _username_from_email(email)
    suffix = 1
    while db.query(User).filter(User.username == username).first():
        candidate = f"{_username_from_email(email)[:90]}_{suffix}"
        username = candidate
        suffix += 1

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_login(db, payload.login)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
