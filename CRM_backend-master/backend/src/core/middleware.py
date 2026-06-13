from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from core.auth import decode_access_token
from core.database import SessionLocal
from models.user import User

PUBLIC_WRITE_PREFIXES = (
    "/api/v1/auth/login",
    "/api/v1/auth/register",
)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            path = request.url.path
            if path.startswith("/api/v1/") and not any(
                path.startswith(prefix) for prefix in PUBLIC_WRITE_PREFIXES
            ):
                auth_header = request.headers.get("Authorization", "")
                if not auth_header.startswith("Bearer "):
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Требуется авторизация"},
                        headers={"WWW-Authenticate": "Bearer"},
                    )

                token = auth_header.removeprefix("Bearer ").strip()
                user_id = decode_access_token(token)
                if user_id is None:
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Недействительный или просроченный токен"},
                        headers={"WWW-Authenticate": "Bearer"},
                    )

                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                finally:
                    db.close()

                if user is None:
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Пользователь не найден"},
                        headers={"WWW-Authenticate": "Bearer"},
                    )

        return await call_next(request)
