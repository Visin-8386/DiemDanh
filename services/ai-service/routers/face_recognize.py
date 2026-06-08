from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db, FaceEmbeddingModel
from services.face_engine import face_engine
from config import settings
from loguru import logger

router = APIRouter()

@router.post("/recognize")
async def recognize_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Recognize a face from uploaded photo.
    Returns matched employee_id and confidence score.
    """
    # 1. Extract embedding from query image
    content = await file.read()
    
    try:
        query_embedding = face_engine.extract_embedding(content)
    except Exception as e:
        raise HTTPException(500, f"Image processing error: {str(e)}")
    
    if query_embedding is None:
        raise HTTPException(422, detail={
            "code": "NO_FACE_DETECTED",
            "message": "Không nhận diện được khuôn mặt. Vui lòng đảm bảo khuôn mặt của bạn rõ ràng và đủ sáng."
        })
    
    # 2. Load all employee embeddings from DB
    all_records = db.query(FaceEmbeddingModel).all()
    
    if len(all_records) == 0:
        raise HTTPException(404, detail={
            "code": "NO_EMPLOYEES_REGISTERED",
            "message": "Hệ thống chưa có dữ liệu khuôn mặt nhân viên nào. Vui lòng đăng ký trước khi điểm danh."
        })
    
    employee_data = [
        {
            'employee_id': r.employee_id,
            'employee_code': r.employee_code,
            'embeddings': r.embeddings
        }
        for r in all_records
    ]
    
    # 3. Find best match
    match = face_engine.find_best_match(
        query_embedding,
        employee_data,
        threshold=settings.face_confidence_threshold
    )
    
    if match is None:
        logger.warning("Face not recognized - no match above threshold")
        return {
            "recognized": False,
            "employee_id": None,
            "confidence": None,
            "message": "Khuôn mặt lạ hoặc chưa được đăng ký. Vui lòng thử lại với ánh sáng tốt hơn."
        }
    
    logger.info(f"Recognized: employee {match['employee_code']} with confidence {match['confidence']}")
    
    return {
        "recognized": True,
        "employee_id": match['employee_id'],
        "employee_code": match['employee_code'],
        "confidence": match['confidence'],
        "message": "Face recognized successfully"
    }

@router.post("/verify/{employee_id}")
async def verify_face(
    employee_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Verify if a photo matches a specific employee (1:1 verification)"""
    record = db.query(FaceEmbeddingModel).filter(
        FaceEmbeddingModel.employee_id == employee_id
    ).first()
    
    if not record:
        raise HTTPException(404, "Employee face not registered")
    
    content = await file.read()
    query_embedding = face_engine.extract_embedding(content)
    
    if query_embedding is None:
        raise HTTPException(422, "No face detected in image")
    
    import numpy as np
    stored_embs = [np.array(e) for e in record.embeddings]
    scores = [face_engine.compute_similarity(query_embedding, se) for se in stored_embs]
    max_score = max(scores)
    
    return {
        "verified": max_score >= settings.face_confidence_threshold,
        "confidence": round(max_score, 4),
        "employee_id": employee_id
    }
