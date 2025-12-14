from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/")
async def get_slips():
    return {"slips": [{"id": 1, "created": datetime.now().isoformat()}]}

@router.post("/")
async def create_slip():
    return {"message": "Slip created", "id": 1}
