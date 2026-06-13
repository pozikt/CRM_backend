from fastapi import APIRouter

router = APIRouter(prefix="/ping", tags=["Utils"])

@router.get("")
async def ping():
    return {"status": "ok"}