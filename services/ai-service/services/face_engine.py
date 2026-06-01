import insightface
from insightface.app import FaceAnalysis
import numpy as np
from PIL import Image
import cv2
import io
from loguru import logger
from typing import Optional

class FaceEngine:
    def __init__(self):
        self.app = None
        self.initialized = False
    
    def initialize(self):
        """Load InsightFace buffalo_sc model (CPU-optimized)"""
        try:
            self.app = FaceAnalysis(
                name='buffalo_sc',
                root='/app/models',
                providers=['CPUExecutionProvider']
            )
            self.app.prepare(ctx_id=-1, det_size=(640, 640))  # -1 = CPU
            self.initialized = True
            logger.info("InsightFace model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load InsightFace model: {e}")
            raise
    
    def decode_image(self, image_bytes: bytes) -> np.ndarray:
        """Decode image bytes to numpy array (BGR for OpenCV)"""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Cannot decode image")
        return img
    
    def extract_embedding(self, image_bytes: bytes) -> Optional[np.ndarray]:
        """Extract 512-dim face embedding from image"""
        if not self.initialized:
            raise RuntimeError("Face engine not initialized")
        
        img = self.decode_image(image_bytes)
        faces = self.app.get(img)
        
        if len(faces) == 0:
            return None
        if len(faces) > 1:
            # Pick the largest face
            faces = sorted(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]), reverse=True)
        
        face = faces[0]
        # Check detection confidence
        if face.det_score < 0.5:
            return None
        
        embedding = face.normed_embedding  # 512-dim normalized vector
        return embedding
    
    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Cosine similarity between two embeddings (already normalized)"""
        return float(np.dot(emb1, emb2))
    
    def find_best_match(
        self,
        query_embedding: np.ndarray,
        employee_embeddings: list,  # List of {employee_id, employee_code, embeddings}
        threshold: float = 0.6
    ) -> Optional[dict]:
        """Find best matching employee"""
        best_score = -1
        best_match = None
        
        for emp in employee_embeddings:
            stored_embs = [np.array(e) for e in emp['embeddings']]
            # Compare with all stored embeddings, take max
            scores = [self.compute_similarity(query_embedding, se) for se in stored_embs]
            max_score = max(scores)
            
            if max_score > best_score:
                best_score = max_score
                best_match = emp
        
        if best_score >= threshold:
            return {
                'employee_id': best_match['employee_id'],
                'employee_code': best_match['employee_code'],
                'confidence': round(best_score, 4)
            }
        return None

# Singleton
face_engine = FaceEngine()
