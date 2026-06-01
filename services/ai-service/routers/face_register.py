from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db, FaceEmbeddingModel
from services.face_engine import face_engine
from loguru import logger
import uuid
import json
from pydantic import BaseModel
from typing import List

router = APIRouter()

@router.post("/register")
async def register_face(
    employee_id: str = Form(...),
    employee_code: str = Form(...),
    files: List[UploadFile] = File(...),  # 1-5 photos
    db: Session = Depends(get_db)
):
    """
    Register face embeddings for an employee.
    Accepts 1-5 photos and stores averaged embeddings.
    """
    if len(files) < 1 or len(files) > 5:
        raise HTTPException(400, "Please provide 1-5 face photos")
    
    embeddings = []
    failed = 0
    
    for file in files:
        try:
            content = await file.read()
            emb = face_engine.extract_embedding(content)
            if emb is not None:
                embeddings.append(emb.tolist())
            else:
                failed += 1
                logger.warning(f"No face detected in {file.filename}")
        except Exception as e:
            failed += 1
            logger.error(f"Error processing {file.filename}: {e}")
    
    if len(embeddings) == 0:
        raise HTTPException(422, "No valid face detected in any of the provided photos. Please use clear, well-lit face photos.")
    
    # Upsert embedding
    existing = db.query(FaceEmbeddingModel).filter(
        FaceEmbeddingModel.employee_id == employee_id
    ).first()
    
    if existing:
        existing.embeddings = embeddings
        existing.photo_count = len(embeddings)
        db.commit()
        action = "updated"
    else:
        record = FaceEmbeddingModel(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            employee_code=employee_code,
            embeddings=embeddings,
            photo_count=len(embeddings)
        )
        db.add(record)
        db.commit()
        action = "created"
    
    logger.info(f"Face {action} for employee {employee_code}: {len(embeddings)} embeddings")
    
    return {
        "success": True,
        "action": action,
        "employee_id": employee_id,
        "embeddings_stored": len(embeddings),
        "failed_photos": failed,
        "message": f"Face registered successfully with {len(embeddings)} photos"
    }

@router.delete("/register/{employee_id}")
def delete_face(
    employee_id: str,
    db: Session = Depends(get_db)
):
    record = db.query(FaceEmbeddingModel).filter(
        FaceEmbeddingModel.employee_id == employee_id
    ).first()
    if not record:
        raise HTTPException(404, "Face not registered")
    db.delete(record)
    db.commit()
    return {"success": True, "message": "Face data deleted"}
