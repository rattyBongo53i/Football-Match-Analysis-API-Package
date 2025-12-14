# app/api/routers/test.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def test():
    return {"message": "Test router works!"}

@router.get("/ping")
async def ping():
    return {"message": "pong"}