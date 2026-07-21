# postlio_backend/app/services/storage/r2.py
"""
Cloudflare R2 (S3-compatible) object storage dla wygenerowanych obrazow.

Zdjecia z providerow AI sa efemeryczne (tymczasowe URL-e wymagajace
autoryzacji albo generowane na zadanie) i nie nadaja sie do zapisu w bazie
ani do publikacji na Instagramie (wymaga publicznego, stalego URL-a do JPEG).
Ten serwis konwertuje obraz do JPEG i zapisuje go trwale w R2, zwracajac
publiczny adres.
"""

import asyncio
import io
import logging
import time
import uuid
from typing import Dict, List, Optional

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

_USAGE_CACHE_TTL_SECONDS = 900  # 15 minut
_DELETE_BATCH_SIZE = 1000  # limit S3/R2 DeleteObjects API


class R2StorageService:
    """Upload obrazow do Cloudflare R2 z bezpiecznikiem darmowego limitu."""

    def __init__(self):
        self._client = None
        self._usage_bytes_cache: Optional[int] = None
        self._usage_cache_at: float = 0.0

    @property
    def is_available(self) -> bool:
        return bool(
            settings.R2_ACCOUNT_ID
            and settings.R2_ACCESS_KEY_ID
            and settings.R2_SECRET_ACCESS_KEY
            and settings.R2_BUCKET_NAME
            and settings.R2_ENDPOINT_URL
            and settings.R2_PUBLIC_URL
        )

    @property
    def _s3(self):
        if self._client is None:
            self._client = boto3.client(
                "s3",
                endpoint_url=settings.R2_ENDPOINT_URL,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=BotoConfig(signature_version="s3v4"),
                region_name="auto",
            )
        return self._client

    def _list_all_raw(self, prefix: str = "") -> List[dict]:
        """Low-level sync listing of every object under prefix (paginated, unfiltered)."""
        objects: List[dict] = []
        paginator = self._s3.get_paginator("list_objects_v2")
        kwargs = {"Bucket": settings.R2_BUCKET_NAME}
        if prefix:
            kwargs["Prefix"] = prefix
        for page in paginator.paginate(**kwargs):
            objects.extend(page.get("Contents", []))
        return objects

    def _get_cached_usage_bytes(self) -> int:
        """Sumaryczny rozmiar bucketa, cache'owany, zeby nie listowac obiektow przy kazdym uploadzie."""
        now = time.monotonic()
        if self._usage_bytes_cache is not None and (now - self._usage_cache_at) < _USAGE_CACHE_TTL_SECONDS:
            return self._usage_bytes_cache

        try:
            total = sum(obj["Size"] for obj in self._list_all_raw())
        except Exception as e:
            logger.error("R2: failed to compute bucket usage, refusing upload to be safe: %s", e)
            # Nieznane zuzycie traktujemy jak "limit przekroczony" - bezpieczniej odmowic uploadu
            # niz ryzykowac przekroczenie darmowego limitu.
            self._usage_bytes_cache = settings.R2_SAFETY_LIMIT_MB * 1024 * 1024
            self._usage_cache_at = now
            return self._usage_bytes_cache

        self._usage_bytes_cache = total
        self._usage_cache_at = now
        return total

    def _within_safety_limit(self, incoming_bytes: int) -> bool:
        limit_bytes = settings.R2_SAFETY_LIMIT_MB * 1024 * 1024
        return (self._get_cached_usage_bytes() + incoming_bytes) <= limit_bytes

    @staticmethod
    def _to_jpeg(image_bytes: bytes) -> bytes:
        """Konwertuje dowolny obraz (PNG/WebP/...) do JPEG - wymog Instagram Content Publishing API."""
        with Image.open(io.BytesIO(image_bytes)) as img:
            if img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGB")
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=90)
            return buffer.getvalue()

    def _put_object(self, key: str, jpeg_bytes: bytes) -> None:
        self._s3.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=key,
            Body=jpeg_bytes,
            ContentType="image/jpeg",
        )

    async def upload_image(self, image_bytes: bytes, folder: str = "posts") -> Optional[str]:
        """
        Konwertuje obraz do JPEG i wysyla do R2.

        Zwraca trwaly publiczny URL, albo None gdy storage niedostepny,
        obraz jest uszkodzony, lub zblizamy sie do darmowego limitu R2.

        boto3 jest synchroniczne, wiec kazde wywolanie sieciowe idzie przez
        asyncio.to_thread - inaczej blokowaloby petle zdarzen i zatrzymywalo
        wszystkie rownolegle zapytania FastAPI na czas uploadu.
        """
        if not self.is_available:
            logger.warning("R2: storage not configured, skipping upload")
            return None

        try:
            jpeg_bytes = await asyncio.to_thread(self._to_jpeg, image_bytes)
        except Exception as e:
            logger.error("R2: failed to convert image to JPEG: %s", e)
            return None

        if not await asyncio.to_thread(self._within_safety_limit, len(jpeg_bytes)):
            logger.error(
                "R2: refusing upload, would exceed safety limit of %d MB. "
                "Images will fall back to ephemeral URLs until storage is freed.",
                settings.R2_SAFETY_LIMIT_MB,
            )
            return None

        key = f"{folder}/{uuid.uuid4().hex}.jpg"

        try:
            await asyncio.to_thread(self._put_object, key, jpeg_bytes)
        except (ClientError, BotoCoreError) as e:
            logger.error("R2: upload failed for key=%s: %s", key, e)
            return None

        if self._usage_bytes_cache is not None:
            self._usage_bytes_cache += len(jpeg_bytes)

        public_url = f"{settings.R2_PUBLIC_URL.rstrip('/')}/{key}"
        logger.info("R2: uploaded image key=%s size=%d bytes", key, len(jpeg_bytes))
        return public_url

    async def list_all_objects(self, prefix: str = "posts/") -> List[Dict]:
        """
        Zwraca [{key, size, last_modified}, ...] dla kazdego obiektu pod prefixem.

        Uzywane przez cotygodniowe czyszczenie osieroconych obrazow - w
        przeciwienstwie do _get_cached_usage_bytes nie jest cache'owane,
        bo cleanup potrzebuje aktualnego stanu bucketa.
        """
        if not self.is_available:
            return []
        try:
            raw = await asyncio.to_thread(self._list_all_raw, prefix)
        except Exception as e:
            logger.error("R2: failed to list objects under prefix=%s: %s", prefix, e)
            return []
        return [
            {"key": obj["Key"], "size": obj["Size"], "last_modified": obj["LastModified"]}
            for obj in raw
        ]

    def _delete_objects_sync(self, keys: List[str]) -> int:
        deleted = 0
        for i in range(0, len(keys), _DELETE_BATCH_SIZE):
            batch = keys[i:i + _DELETE_BATCH_SIZE]
            response = self._s3.delete_objects(
                Bucket=settings.R2_BUCKET_NAME,
                Delete={"Objects": [{"Key": k} for k in batch], "Quiet": True},
            )
            errors = response.get("Errors", [])
            if errors:
                logger.error(
                    "R2: failed to delete %d/%d objects in batch: %s",
                    len(errors), len(batch), errors,
                )
            deleted += len(batch) - len(errors)
        return deleted

    async def delete_objects(self, keys: List[str]) -> int:
        """
        Batch-usuwa obiekty (max 1000 na wywolanie API, dzielone automatycznie).

        Invaliduje cache zuzycia, zeby zwolnione miejsce bylo widoczne od razu
        w bezpieczniku uploadu, zamiast czekac na wygasniecie 15-minutowego cache.
        """
        if not self.is_available or not keys:
            return 0
        try:
            deleted = await asyncio.to_thread(self._delete_objects_sync, keys)
        except (ClientError, BotoCoreError) as e:
            logger.error("R2: batch delete failed: %s", e)
            return 0
        self._usage_bytes_cache = None
        return deleted


r2_storage = R2StorageService()
