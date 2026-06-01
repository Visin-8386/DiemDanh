from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://diemdanh_user:StrongPass2024@postgres:5432/diemdanh"
    face_confidence_threshold: float = 0.6
    model_name: str = "buffalo_sc"  # InsightFace model (small, CPU-friendly)
    max_faces_per_image: int = 1
    embedding_size: int = 512
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
