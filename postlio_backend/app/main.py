# postlio_backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import asyncio

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.database import init_db, close_db
from app.api.rate_limit import limiter
from app.api.v1 import auth, posts, brands, ai, autopilot, social
from app.api.exceptions import register_exception_handlers
from app.services.scheduler_service import start_scheduler, stop_scheduler

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def preload_services():
    """Preload serwisów AI w tle (nie blokuje startu)."""
    try:
        # Import lazy - nie blokuje startu
        from app.services.ai.text.manager import text_ai_manager
        from app.services.ai.image.manager import image_ai_manager

        # Sprawdź dostępność providerów
        text_providers = text_ai_manager.get_available_providers()
        image_providers = image_ai_manager.get_available_providers()

        logger.info(f"✅ AI Providers preloaded: text={text_providers}, image={image_providers}")
    except Exception as e:
        logger.warning(f"⚠️ AI preload failed (non-critical): {e}")


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

    # Preload AI w tle (nie blokuje)
    asyncio.create_task(preload_services())

    yield

    # Shutdown
    logger.info("🛑 Shutting down...")
    await stop_scheduler()
    logger.info("✅ Scheduler stopped")
    await close_db()
    logger.info("✅ Database connections closed")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Postlio API - Social Media Management with AI",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Health Endpoints ====================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - szybka odpowiedź."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check - SZYBKI, bez bazy danych.
    Używany do warmup z frontendu.
    """
    return {"status": "healthy", "version": settings.APP_VERSION}


@app.get("/health/full", tags=["Health"])
async def full_health_check():
    """
    Pełny health check z bazą danych.
    """
    from app.database import get_db
    from sqlalchemy import text

    try:
        async for db in get_db():
            await db.execute(text("SELECT 1"))
            db_status = "healthy"
            break
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "version": settings.APP_VERSION,
        "database": db_status,
    }


# ==================== Routers ====================

for _router in (auth.router, posts.router, brands.router, ai.router, social.router, autopilot.router):
    app.include_router(_router, prefix=settings.API_V1_PREFIX)