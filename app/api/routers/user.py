from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_users():
    return {"users": [{"id": 1, "username": "admin"}]}

@router.post("/login")
async def login():
    return {"token": "mock-token", "user": {"id": 1}}
