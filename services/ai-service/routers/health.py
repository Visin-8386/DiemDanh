from fastapi import APIRouter
from services.face_engine import face_engine

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "face_engine_ready": face_engine.initialized,
        "model": "InsightFace buffalo_sc"
    }
