# postlio_backend/app/services/storage/cleanup_service.py
"""
Cotygodniowe czyszczenie osieroconych obrazow w R2.

Kreator AI wysyla obraz do R2 od razu po wygenerowaniu - zanim uzytkownik
zdecyduje, czy go zachowac. Odrzucone warianty, porzucone szkice i zamkniete
karty przegladarki zostawiaja w R2 pliki, do ktorych nie odwoluje sie zaden
Post ani AutopilotQueueItem. Bez czyszczenia to tylko rosnie i w koncu
uderza w bezpiecznik darmowego limitu z R2StorageService, mimo ze te obrazy
niczemu juz nie sluza.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Set
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.autopilot import AutopilotQueueItem
from app.models.post import Post
from app.services.storage.r2 import r2_storage

logger = logging.getLogger(__name__)

# Obraz mlodszy niz to nigdy nie jest usuwany - chroni sesje, w ktorej
# uzytkownik dopiero co wygenerowal zdjecie w Kreatorze AI i jeszcze nie
# zdazyl zapisac posta.
MIN_AGE_BEFORE_DELETION = timedelta(hours=24)


def _extract_r2_key(url: Optional[str]) -> Optional[str]:
    """
    Wyciaga klucz obiektu R2 z publicznego URL-a.

    Zwraca None dla wszystkiego innego (legacy URL-e Pollinations/HuggingFace,
    base64, puste pola) - cleanup nigdy nie powinien dotykac danych spoza R2.
    """
    if not url or not settings.R2_PUBLIC_URL:
        return None

    prefix = settings.R2_PUBLIC_URL.rstrip("/") + "/"
    if not url.startswith(prefix):
        return None

    return urlparse(url).path.lstrip("/")


async def _referenced_keys(db: AsyncSession) -> Set[str]:
    """Zbior kluczy R2 aktualnie uzywanych przez jakikolwiek Post lub AutopilotQueueItem."""
    post_urls = (
        await db.execute(select(Post.image_url).where(Post.image_url.is_not(None)))
    ).scalars().all()
    queue_urls = (
        await db.execute(select(AutopilotQueueItem.image_url).where(AutopilotQueueItem.image_url.is_not(None)))
    ).scalars().all()

    keys = set()
    for url in (*post_urls, *queue_urls):
        key = _extract_r2_key(url)
        if key:
            keys.add(key)
    return keys


async def cleanup_orphaned_images(db: AsyncSession) -> Dict[str, int]:
    """
    Usuwa z R2 obiekty pod posts/, ktore nie sa referencjonowane przez zaden
    Post ani AutopilotQueueItem i sa starsze niz MIN_AGE_BEFORE_DELETION.

    Nie modyfikuje bazy danych - tylko czyta URL-e i usuwa pliki w R2.
    """
    if not r2_storage.is_available:
        logger.debug("R2 cleanup: storage not configured, skipping")
        return {"skipped": True}

    referenced = await _referenced_keys(db)
    bucket_objects = await r2_storage.list_all_objects()

    cutoff = datetime.now(timezone.utc) - MIN_AGE_BEFORE_DELETION
    orphaned_keys = [
        obj["key"] for obj in bucket_objects
        if obj["key"] not in referenced and obj["last_modified"] < cutoff
    ]

    deleted = await r2_storage.delete_objects(orphaned_keys)

    stats = {
        "bucket_objects": len(bucket_objects),
        "referenced": len(referenced),
        "orphaned": len(orphaned_keys),
        "deleted": deleted,
    }
    logger.info(
        "R2 cleanup: %d objects in bucket, %d referenced, %d orphaned, %d deleted",
        stats["bucket_objects"], stats["referenced"], stats["orphaned"], stats["deleted"],
    )
    return stats
