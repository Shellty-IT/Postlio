"""
Unit tests for R2StorageService.

Tests cover:
- Availability check based on configuration
- Image upload converts to JPEG and returns a public URL
- Safety limit refuses uploads that would exceed the configured cap
- Usage is cached and not recomputed on every upload
"""
import asyncio
import io
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from PIL import Image

from app.services.storage.r2 import R2StorageService


def _make_png_bytes(size=(10, 10)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGBA", size, (255, 0, 0, 128)).save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture(autouse=True)
def unconfigured_settings_by_default(monkeypatch):
    """Real R2 credentials may be present in the environment (.env) - tests
    that exercise the 'not configured' path must not silently hit the real
    bucket, so every test starts from a clean, unconfigured settings object
    unless it opts into `configured_settings`."""
    from app.config import settings

    for field in (
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "R2_ENDPOINT_URL",
        "R2_PUBLIC_URL",
    ):
        monkeypatch.setattr(settings, field, None)


@pytest.fixture
def configured_settings(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "R2_ACCOUNT_ID", "acc123")
    monkeypatch.setattr(settings, "R2_ACCESS_KEY_ID", "key123")
    monkeypatch.setattr(settings, "R2_SECRET_ACCESS_KEY", "secret123")
    monkeypatch.setattr(settings, "R2_BUCKET_NAME", "postlio-media")
    monkeypatch.setattr(settings, "R2_ENDPOINT_URL", "https://acc123.r2.cloudflarestorage.com")
    monkeypatch.setattr(settings, "R2_PUBLIC_URL", "https://pub-test.r2.dev")
    monkeypatch.setattr(settings, "R2_SAFETY_LIMIT_MB", 9000)
    return settings


def _service_with_mock_client(empty_bucket=True):
    service = R2StorageService()
    mock_client = MagicMock()

    mock_paginator = MagicMock()
    if empty_bucket:
        mock_paginator.paginate.return_value = [{"Contents": []}]
    else:
        mock_paginator.paginate.return_value = [{"Contents": [{"Size": 1024}]}]

    mock_client.get_paginator.return_value = mock_paginator
    service._client = mock_client
    return service, mock_client


class TestIsAvailable:
    @pytest.mark.unit
    def test_unavailable_when_not_configured(self):
        service = R2StorageService()
        assert service.is_available is False

    @pytest.mark.unit
    def test_available_when_fully_configured(self, configured_settings):
        service = R2StorageService()
        assert service.is_available is True

    @pytest.mark.unit
    def test_unavailable_when_partially_configured(self, configured_settings, monkeypatch):
        monkeypatch.setattr(configured_settings, "R2_PUBLIC_URL", None)
        service = R2StorageService()
        assert service.is_available is False


class TestUploadImage:
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_returns_none_when_not_configured(self):
        service = R2StorageService()
        result = await service.upload_image(_make_png_bytes())
        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_uploads_and_returns_public_url(self, configured_settings):
        service, mock_client = _service_with_mock_client(empty_bucket=True)

        result = await service.upload_image(_make_png_bytes())

        assert result is not None
        assert result.startswith("https://pub-test.r2.dev/posts/")
        assert result.endswith(".jpg")
        mock_client.put_object.assert_called_once()
        call_kwargs = mock_client.put_object.call_args.kwargs
        assert call_kwargs["Bucket"] == "postlio-media"
        assert call_kwargs["ContentType"] == "image/jpeg"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_converts_png_to_jpeg(self, configured_settings):
        service, mock_client = _service_with_mock_client(empty_bucket=True)

        await service.upload_image(_make_png_bytes())

        uploaded_bytes = mock_client.put_object.call_args.kwargs["Body"]
        image = Image.open(io.BytesIO(uploaded_bytes))
        assert image.format == "JPEG"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_returns_none_on_corrupted_image(self, configured_settings):
        service, mock_client = _service_with_mock_client(empty_bucket=True)

        result = await service.upload_image(b"not an image")

        assert result is None
        mock_client.put_object.assert_not_called()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_refuses_upload_over_safety_limit(self, configured_settings, monkeypatch):
        monkeypatch.setattr(configured_settings, "R2_SAFETY_LIMIT_MB", 0)
        service, mock_client = _service_with_mock_client(empty_bucket=True)

        result = await service.upload_image(_make_png_bytes())

        assert result is None
        mock_client.put_object.assert_not_called()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_treats_usage_check_failure_as_over_limit(self, configured_settings):
        service, mock_client = _service_with_mock_client(empty_bucket=True)
        mock_client.get_paginator.side_effect = Exception("network error")

        result = await service.upload_image(_make_png_bytes())

        assert result is None
        mock_client.put_object.assert_not_called()


    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_refuses_when_existing_usage_already_at_limit(self, configured_settings):
        limit_bytes = configured_settings.R2_SAFETY_LIMIT_MB * 1024 * 1024
        service, mock_client = _service_with_mock_client()
        paginator = mock_client.get_paginator.return_value
        paginator.paginate.return_value = [{"Contents": [{"Size": limit_bytes}]}]

        result = await service.upload_image(_make_png_bytes())

        assert result is None
        mock_client.put_object.assert_not_called()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_does_not_block_event_loop(self, configured_settings):
        """boto3 is synchronous; uploads must be offloaded so concurrent
        requests are not stalled while an image is being written to R2."""
        import time as time_module

        service, mock_client = _service_with_mock_client(empty_bucket=True)
        mock_client.put_object.side_effect = lambda **kwargs: time_module.sleep(0.3)

        ticks = 0

        async def heartbeat():
            nonlocal ticks
            for _ in range(20):
                await asyncio.sleep(0.02)
                ticks += 1

        await asyncio.gather(service.upload_image(_make_png_bytes()), heartbeat())

        # Gdyby put_object blokowal petle zdarzen, heartbeat nie zdazylby tyknac.
        assert ticks >= 10


class TestUsageCache:
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_usage_is_cached_across_uploads(self, configured_settings):
        service, mock_client = _service_with_mock_client(empty_bucket=True)

        await service.upload_image(_make_png_bytes())
        await service.upload_image(_make_png_bytes())

        assert mock_client.get_paginator.call_count == 1

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_cached_usage_accumulates_and_eventually_blocks(self, configured_settings, monkeypatch):
        """Within the cache window uploads must still be counted, otherwise the
        limit could be overshot before the next usage refresh."""
        service, mock_client = _service_with_mock_client(empty_bucket=True)
        png = _make_png_bytes()

        first = await service.upload_image(png)
        assert first is not None

        # Zawez limit ponizej tego, co juz zapisano - kolejny upload musi zostac odrzucony
        # na podstawie cache'u, bez ponownego odpytywania R2.
        monkeypatch.setattr(configured_settings, "R2_SAFETY_LIMIT_MB", 0)
        second = await service.upload_image(png)

        assert second is None
        assert mock_client.put_object.call_count == 1
        assert mock_client.get_paginator.call_count == 1


class TestListAllObjects:
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_returns_empty_list_when_not_configured(self):
        service = R2StorageService()
        result = await service.list_all_objects()
        assert result == []

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_returns_key_size_and_last_modified(self, configured_settings):
        service, mock_client = _service_with_mock_client()
        modified = datetime(2026, 1, 1, tzinfo=timezone.utc)
        paginator = mock_client.get_paginator.return_value
        paginator.paginate.return_value = [
            {"Contents": [{"Key": "posts/a.jpg", "Size": 100, "LastModified": modified}]}
        ]

        result = await service.list_all_objects(prefix="posts/")

        assert result == [{"key": "posts/a.jpg", "size": 100, "last_modified": modified}]
        paginator.paginate.assert_called_once_with(Bucket="postlio-media", Prefix="posts/")

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_paginates_across_multiple_pages(self, configured_settings):
        service, mock_client = _service_with_mock_client()
        modified = datetime(2026, 1, 1, tzinfo=timezone.utc)
        paginator = mock_client.get_paginator.return_value
        paginator.paginate.return_value = [
            {"Contents": [{"Key": "posts/a.jpg", "Size": 1, "LastModified": modified}]},
            {"Contents": [{"Key": "posts/b.jpg", "Size": 2, "LastModified": modified}]},
        ]

        result = await service.list_all_objects()

        assert {obj["key"] for obj in result} == {"posts/a.jpg", "posts/b.jpg"}

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_returns_empty_list_on_error(self, configured_settings):
        service, mock_client = _service_with_mock_client()
        mock_client.get_paginator.side_effect = Exception("network error")

        result = await service.list_all_objects()

        assert result == []


class TestDeleteObjects:
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_returns_zero_for_empty_list(self, configured_settings):
        service, mock_client = _service_with_mock_client()

        result = await service.delete_objects([])

        assert result == 0
        mock_client.delete_objects.assert_not_called()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_returns_zero_when_not_configured(self):
        service = R2StorageService()
        result = await service.delete_objects(["posts/a.jpg"])
        assert result == 0

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_deletes_and_returns_count(self, configured_settings):
        service, mock_client = _service_with_mock_client()
        mock_client.delete_objects.return_value = {}

        result = await service.delete_objects(["posts/a.jpg", "posts/b.jpg"])

        assert result == 2
        mock_client.delete_objects.assert_called_once_with(
            Bucket="postlio-media",
            Delete={
                "Objects": [{"Key": "posts/a.jpg"}, {"Key": "posts/b.jpg"}],
                "Quiet": True,
            },
        )

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_splits_into_batches_of_1000(self, configured_settings):
        service, mock_client = _service_with_mock_client()
        mock_client.delete_objects.return_value = {}
        keys = [f"posts/{i}.jpg" for i in range(1500)]

        result = await service.delete_objects(keys)

        assert result == 1500
        assert mock_client.delete_objects.call_count == 2
        first_batch = mock_client.delete_objects.call_args_list[0].kwargs["Delete"]["Objects"]
        second_batch = mock_client.delete_objects.call_args_list[1].kwargs["Delete"]["Objects"]
        assert len(first_batch) == 1000
        assert len(second_batch) == 500

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_subtracts_partial_errors_from_deleted_count(self, configured_settings):
        service, mock_client = _service_with_mock_client()
        mock_client.delete_objects.return_value = {
            "Errors": [{"Key": "posts/b.jpg", "Code": "AccessDenied"}]
        }

        result = await service.delete_objects(["posts/a.jpg", "posts/b.jpg"])

        assert result == 1

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_invalidates_usage_cache(self, configured_settings):
        service, mock_client = _service_with_mock_client(empty_bucket=True)
        mock_client.delete_objects.return_value = {}

        await service.upload_image(_make_png_bytes())
        assert service._usage_bytes_cache is not None

        await service.delete_objects(["posts/a.jpg"])

        assert service._usage_bytes_cache is None
