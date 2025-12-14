from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_markets():
    return {"markets": ["1x2", "over_under", "btts"]}
