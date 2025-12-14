from fastapi import APIRouter
import random

router = APIRouter()

@router.get("/recommendations")
async def get_recommendations():
    return {
        "recommendations": [
            {"match": f"Match {i}", "odds": round(random.uniform(1.5, 4.0), 2)}
            for i in range(5)
        ]
    }
