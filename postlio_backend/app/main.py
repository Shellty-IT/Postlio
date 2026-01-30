# postlio_backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.database import init_db, close_db
from app.api.v1 import auth, posts, brands, ai, autopilot, social  # ← DODANE: social
from app.services.scheduler_service import start_scheduler, stop_scheduler

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager dla FastAPI."""
    logger.info("🚀 Starting Postlio API...")

    # Inicjalizacja bazy danych
    await init_db()
    logger.info("✅ Database initialized")

    # Uruchom scheduler dla Autopilota
    await start_scheduler()
    logger.info("✅ Autopilot scheduler started")

    yield

    # Shutdown
    logger.info("🛑 Shutting down...")

    # Zatrzymaj scheduler
    await stop_scheduler()
    logger.info("✅ Scheduler stopped")

    # Zamknij połączenia z bazą
    await close_db()
    logger.info("✅ Database connections closed")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="🚀 Postlio API - Social Media Management with AI",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


# Auth & Core
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(posts.router, prefix=f"{settings.API_V1_PREFIX}/posts", tags=["Posts"])
app.include_router(brands.router, prefix=f"{settings.API_V1_PREFIX}/brands", tags=["Brand Voice"])
app.include_router(ai.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI Generation"])

# Social Media  ← DODANE
app.include_router(social.router, prefix=settings.API_V1_PREFIX, tags=["Social Media"])

# Autopilot
app.include_router(autopilot.router, prefix=settings.API_V1_PREFIX, tags=["Autopilot"])