from sqlalchemy import create_engine, Column, String, JSON, DateTime, Float, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class FaceEmbeddingModel(Base):
    __tablename__ = "face_embeddings"
    id = Column(String, primary_key=True)
    employee_id = Column(String, unique=True, nullable=False, index=True)
    employee_code = Column(String, nullable=False)
    embeddings = Column(JSON, nullable=False)  # List of 512-dim float vectors
    photo_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
