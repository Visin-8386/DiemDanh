from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import sys

# Setup loguru
logger.remove()
logger.add(sys.stdout, format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}", level="INFO")

# Lifespan: load InsightFace model at startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    from database import init_db
    init_db()
    logger.info("Database initialized successfully!")
    logger.info("Loading InsightFace models...")
    from services.face_engine import face_engine
    face_engine.initialize()
    logger.info("Face engine ready!")
    yield
    logger.info("Shutting down AI service")

app = FastAPI(
    title="DiemDanh AI Service",
    description="Face Recognition API for Attendance System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Include routers
from routers import face_register, face_recognize, health
app.include_router(health.router, tags=["Health"])
app.include_router(face_register.router, prefix="/face", tags=["Face Registration"])
app.include_router(face_recognize.router, prefix="/face", tags=["Face Recognition"])
