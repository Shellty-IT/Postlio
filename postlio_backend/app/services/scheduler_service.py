# postlio_backend/app/services/scheduler_service.py
"""
Scheduler Service - automatyczne generowanie i publikacja postów.

Używa APScheduler do uruchamiania zadań w tle.
Dwa główne zadania:
1. Generowanie postów według harmonogramu
2. Publikowanie zatwierdzonych postów w ich scheduled_for czasie
"""
import logging
from datetime import datetime, timedelta
from typing import Optional
import pytz

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session_maker
from app.models.autopilot import AutopilotConfig
from app.services.autopilot_service import AutopilotService
from app.services.publish_service import PublishService
from app.services.storage import cleanup_orphaned_images

logger = logging.getLogger(__name__)


class SchedulerService:
    """
    Serwis do automatycznego generowania i publikacji postów.

    Działa w tle i:
    - Co minutę sprawdza czy któraś konfiguracja wymaga nowych postów
    - Co minutę sprawdza czy są zatwierdzone posty do publikacji
    """

    def __init__(self):
        self.scheduler: Optional[AsyncIOScheduler] = None
        self._is_running = False

    async def start(self):
        """Uruchom scheduler."""
        if self._is_running:
            logger.warning("Scheduler already running")
            return

        self.scheduler = AsyncIOScheduler(timezone=pytz.UTC)

        # Job 1: Sprawdzanie harmonogramów generowania
        self.scheduler.add_job(
            self._check_generation_schedules,
            trigger=IntervalTrigger(minutes=1),
            id="check_autopilot_schedules",
            name="Check Autopilot Schedules",
            replace_existing=True,
            max_instances=1,
        )

        # Job 2: Publikowanie zatwierdzonych postów
        self.scheduler.add_job(
            self._check_publish_queue,
            trigger=IntervalTrigger(minutes=1),
            id="check_publish_queue",
            name="Check Publish Queue",
            replace_existing=True,
            max_instances=1,
        )

        # Job 3: Cotygodniowe czyszczenie osieroconych obrazow w R2
        self.scheduler.add_job(
            self._check_r2_cleanup,
            trigger=CronTrigger(day_of_week="sun", hour=3, minute=0),
            id="r2_cleanup",
            name="R2 Orphaned Images Cleanup",
            replace_existing=True,
            max_instances=1,
        )

        self.scheduler.start()
        self._is_running = True
        logger.info("🕐 Scheduler started - generation & publishing every minute, R2 cleanup weekly")

    async def stop(self):
        """Zatrzymaj scheduler."""
        if self.scheduler and self._is_running:
            self.scheduler.shutdown(wait=False)
            self._is_running = False
            logger.info("🛑 Scheduler stopped")

    # ==================== Generation ====================

    async def _check_generation_schedules(self):
        """
        Sprawdź wszystkie aktywne konfiguracje i wygeneruj posty jeśli potrzeba.
        """
        logger.debug("Checking autopilot generation schedules...")

        try:
            async with async_session_maker() as db:
                result = await db.execute(
                    select(AutopilotConfig)
                    .where(AutopilotConfig.is_active)
                    .where(~AutopilotConfig.is_paused)
                )
                configs = list(result.scalars().all())

                if not configs:
                    logger.debug("No active autopilot configs found")
                    return

                logger.debug(f"Found {len(configs)} active configs to check for generation")

                for config in configs:
                    try:
                        await self._process_generation_config(db, config)
                    except Exception as e:
                        logger.error(f"Error processing generation config {config.id}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Error in generation schedule check: {e}")

    async def _process_generation_config(self, db: AsyncSession, config: AutopilotConfig):
        """Sprawdź i przetwórz konfigurację - czy generować nowe posty."""
        now = datetime.utcnow()

        try:
            tz = pytz.timezone(config.timezone or "Europe/Warsaw")
        except Exception:
            tz = pytz.timezone("Europe/Warsaw")

        local_now = now.replace(tzinfo=pytz.UTC).astimezone(tz)
        day_name = local_now.strftime("%A").lower()
        schedule_days = config.schedule_days or ["monday", "wednesday", "friday"]

        if day_name not in schedule_days:
            return

        schedule_time = config.schedule_time or "10:00"
        try:
            schedule_hour, schedule_minute = map(int, schedule_time.split(":"))
        except Exception:
            schedule_hour, schedule_minute = 10, 0

        current_minutes = local_now.hour * 60 + local_now.minute
        scheduled_minutes = schedule_hour * 60 + schedule_minute
        time_diff = abs(current_minutes - scheduled_minutes)

        if time_diff > settings.AUTOPILOT_GENERATION_WINDOW_MINUTES:
            return

        # Sprawdź czy już generowaliśmy
        if config.last_generation_at:
            time_since_last = now - config.last_generation_at
            if time_since_last < timedelta(minutes=30):
                return

        logger.info(f"🤖 Config {config.id}: Time to generate! ({day_name} {schedule_time})")
        await self._generate_for_config(db, config)

    async def _generate_for_config(self, db: AsyncSession, config: AutopilotConfig):
        """Wygeneruj posty dla konfiguracji."""
        try:
            service = AutopilotService(db)
            platforms = config.platforms or ["facebook"]
            count = len(platforms)

            logger.info(f"Generating {count} posts for config {config.id}...")

            items, errors = await service.generate_posts(
                config=config,
                count=count,
                platforms=platforms,
            )

            await db.commit()

            if items:
                logger.info(f"✅ Config {config.id}: Generated {len(items)} posts")
            if errors:
                logger.warning(f"⚠️ Config {config.id}: {len(errors)} errors: {errors}")

        except Exception as e:
            logger.error(f"Failed to generate for config {config.id}: {e}")
            await db.rollback()

    # ==================== Publishing ====================

    async def _check_publish_queue(self):
        """
        Sprawdź kolejkę i opublikuj zatwierdzone posty,
        których scheduled_for już minął.
        """
        logger.debug("Checking publish queue...")

        try:
            async with async_session_maker() as db:
                publish_service = PublishService(db)

                published, failed, results = await publish_service.publish_approved_items(
                    limit=10  # Max 10 postów na raz
                )

                if published > 0 or failed > 0:
                    logger.info(
                        f"📤 Publish queue check: {published} published, {failed} failed"
                    )

                await db.commit()

        except Exception as e:
            logger.error(f"Error in publish queue check: {e}")

    # ==================== R2 Cleanup ====================

    async def _check_r2_cleanup(self):
        """Usuń z R2 obrazy nieużywane przez żaden Post ani AutopilotQueueItem."""
        logger.debug("Running R2 orphaned images cleanup...")

        try:
            async with async_session_maker() as db:
                stats = await cleanup_orphaned_images(db)

                if stats.get("deleted"):
                    logger.info(f"🧹 R2 cleanup: deleted {stats['deleted']} orphaned images")

        except Exception as e:
            logger.error(f"Error in R2 cleanup: {e}")

    # ==================== Manual Triggers (for API) ====================

    async def trigger_generation_check(self):
        """Ręcznie uruchom sprawdzanie generowania."""
        await self._check_generation_schedules()

    async def trigger_publish_check(self):
        """Ręcznie uruchom sprawdzanie publikacji."""
        await self._check_publish_queue()

    async def trigger_r2_cleanup(self):
        """Ręcznie uruchom czyszczenie osieroconych obrazów w R2."""
        await self._check_r2_cleanup()


# Singleton instance
scheduler_service = SchedulerService()


async def start_scheduler():
    """Uruchom scheduler (wywoływane przy starcie aplikacji)."""
    await scheduler_service.start()


async def stop_scheduler():
    """Zatrzymaj scheduler (wywoływane przy zamknięciu aplikacji)."""
    await scheduler_service.stop()