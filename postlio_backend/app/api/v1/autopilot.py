"""
API endpoints dla Autopilota.
"""
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.api.exceptions import NotFoundError
from app.models.user import User
from app.models.autopilot import AutopilotConfig, AutopilotQueueItem
from app.repositories import autopilot_repo
from app.schemas.autopilot import (
    AutopilotConfigCreate,
    AutopilotConfigUpdate,
    AutopilotConfigResponse,
    QueueItemUpdate,
    QueueItemResponse,
    GenerateQueueRequest,
    GenerateQueueResponse,
    BulkActionRequest,
    QueueStatsResponse,
    AutopilotDashboardResponse,
    # NOWE
    PublishRequest,
    PublishResponse,
    BulkPublishResponse,
)
from app.services.autopilot_service import get_autopilot_service
from app.services.publish_service import get_publish_service
from app.config import settings


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/autopilot", tags=["Autopilot"])


# === HELPERS ===

def config_to_response(
    config: AutopilotConfig,
    health_score: int = None,
    next_gen: datetime = None,
) -> AutopilotConfigResponse:
    response = AutopilotConfigResponse.model_validate(config)
    response.health_score = health_score
    response.next_generation_at = next_gen
    return response


def queue_item_to_response(item: AutopilotQueueItem) -> QueueItemResponse:
    return QueueItemResponse.model_validate(item)


# === CONFIG ENDPOINTS ===

@router.get("/configs", response_model=List[AutopilotConfigResponse])
async def get_configs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pobierz wszystkie konfiguracje Autopilota użytkownika."""
    service = get_autopilot_service(db)
    configs = await service.get_user_configs(current_user.id)

    responses = []
    for config in configs:
        stats = await service.get_queue_stats(config.id, current_user.id)
        health = service.calculate_health_score(config, stats)
        next_gen = service.get_next_scheduled_time(config)
        responses.append(config_to_response(config, health, next_gen))

    return responses


@router.get("/configs/{config_id}", response_model=AutopilotConfigResponse)
async def get_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pobierz konfigurację Autopilota."""
    service = get_autopilot_service(db)
    config = await service.get_config(config_id, current_user.id)

    if not config:
        raise NotFoundError("Config")

    stats = await service.get_queue_stats(config.id, current_user.id)
    health = service.calculate_health_score(config, stats)
    next_gen = service.get_next_scheduled_time(config)

    return config_to_response(config, health, next_gen)


@router.get("/configs/brand/{brand_id}", response_model=AutopilotConfigResponse)
async def get_config_by_brand(
    brand_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pobierz konfigurację Autopilota dla marki."""
    service = get_autopilot_service(db)
    config = await service.get_config_by_brand(brand_id, current_user.id)

    if not config:
        raise NotFoundError("Config for this brand")

    stats = await service.get_queue_stats(config.id, current_user.id)
    health = service.calculate_health_score(config, stats)
    next_gen = service.get_next_scheduled_time(config)

    return config_to_response(config, health, next_gen)


@router.post("/configs", response_model=AutopilotConfigResponse, status_code=201)
async def create_config(
    data: AutopilotConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Utwórz nową konfigurację Autopilota."""
    service = get_autopilot_service(db)

    try:
        config = await service.create_config(current_user.id, data)
        await db.commit()
        return config_to_response(config, 100, service.get_next_scheduled_time(config))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/configs/{config_id}", response_model=AutopilotConfigResponse)
async def update_config(
    config_id: int,
    data: AutopilotConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Zaktualizuj konfigurację Autopilota."""
    service = get_autopilot_service(db)
    config = await service.update_config(config_id, current_user.id, data)

    if not config:
        raise NotFoundError("Config")

    await db.commit()
    stats = await service.get_queue_stats(config.id, current_user.id)
    health = service.calculate_health_score(config, stats)
    next_gen = service.get_next_scheduled_time(config)

    return config_to_response(config, health, next_gen)


@router.delete("/configs/{config_id}", status_code=204)
async def delete_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Usuń konfigurację Autopilota."""
    service = get_autopilot_service(db)
    deleted = await service.delete_config(config_id, current_user.id)

    if not deleted:
        raise NotFoundError("Config")

    await db.commit()


@router.post("/configs/{config_id}/activate", response_model=AutopilotConfigResponse)
async def activate_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aktywuj Autopilota."""
    service = get_autopilot_service(db)
    config = await service.toggle_active(config_id, current_user.id, True)

    if not config:
        raise NotFoundError("Config")

    await db.commit()
    stats = await service.get_queue_stats(config.id, current_user.id)
    health = service.calculate_health_score(config, stats)
    next_gen = service.get_next_scheduled_time(config)

    return config_to_response(config, health, next_gen)


@router.post("/configs/{config_id}/deactivate", response_model=AutopilotConfigResponse)
async def deactivate_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dezaktywuj Autopilota."""
    service = get_autopilot_service(db)
    config = await service.toggle_active(config_id, current_user.id, False)

    if not config:
        raise NotFoundError("Config")

    await db.commit()
    stats = await service.get_queue_stats(config.id, current_user.id)
    health = service.calculate_health_score(config, stats)

    return config_to_response(config, health, None)


@router.post("/configs/{config_id}/pause", response_model=AutopilotConfigResponse)
async def pause_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Wstrzymaj Autopilota."""
    service = get_autopilot_service(db)
    config = await service.toggle_pause(config_id, current_user.id, True)

    if not config:
        raise NotFoundError("Config")

    await db.commit()
    stats = await service.get_queue_stats(config.id, current_user.id)
    health = service.calculate_health_score(config, stats)

    return config_to_response(config, health, None)


@router.post("/configs/{config_id}/resume", response_model=AutopilotConfigResponse)
async def resume_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Wznów Autopilota."""
    service = get_autopilot_service(db)
    config = await service.toggle_pause(config_id, current_user.id, False)

    if not config:
        raise NotFoundError("Config")

    await db.commit()
    stats = await service.get_queue_stats(config.id, current_user.id)
    health = service.calculate_health_score(config, stats)
    next_gen = service.get_next_scheduled_time(config)

    return config_to_response(config, health, next_gen)


# === NOWE: Social Accounts Status dla Config ===

@router.get("/configs/{config_id}/social-status", response_model=dict)
async def get_config_social_status(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sprawdź status kont social media dla konfiguracji.

    Zwraca status każdej platformy: connected, expired, missing, inactive
    """
    service = get_autopilot_service(db)
    config = await service.get_config(config_id, current_user.id)

    if not config:
        raise NotFoundError("Config")

    publish_service = get_publish_service(db)
    status = await publish_service.validate_social_accounts_for_config(config)

    return {
        "config_id": config_id,
        "platforms": config.platforms or [],
        "social_accounts_status": status,
        "all_connected": all(s == "connected" for s in status.values()) if status else False
    }


# === GENERATE ENDPOINT ===

@router.post("/configs/{config_id}/generate", response_model=GenerateQueueResponse)
async def generate_posts(
    config_id: int,
    request: GenerateQueueRequest = GenerateQueueRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generuj posty dla konfiguracji Autopilota.
    """
    service = get_autopilot_service(db)
    config = await service.get_config(config_id, current_user.id)

    if not config:
        raise NotFoundError("Config")

    try:
        items, errors = await service.generate_posts(
            config=config,
            count=request.count,
            topics=request.topics,
            platforms=request.platforms,
        )

        await db.commit()

        return GenerateQueueResponse(
            success=len(items) > 0,
            generated_count=len(items),
            failed_count=len(errors),
            items=[queue_item_to_response(item) for item in items],
            errors=errors,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Generation failed for config %s", config_id)
        raise HTTPException(status_code=500, detail="Post generation failed. Please try again.")


# === QUEUE ENDPOINTS ===

@router.get("/configs/{config_id}/queue", response_model=List[QueueItemResponse])
async def get_queue(
    config_id: int,
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pobierz elementy kolejki."""
    service = get_autopilot_service(db)

    config = await service.get_config(config_id, current_user.id)
    if not config:
        raise NotFoundError("Config")

    items = await service.get_queue_items(config_id, current_user.id, status, limit, offset)
    return [queue_item_to_response(item) for item in items]


@router.get("/configs/{config_id}/queue/stats", response_model=QueueStatsResponse)
async def get_queue_stats(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pobierz statystyki kolejki."""
    service = get_autopilot_service(db)

    config = await service.get_config(config_id, current_user.id)
    if not config:
        raise NotFoundError("Config")

    return await service.get_queue_stats(config_id, current_user.id)


@router.get("/queue/{item_id}", response_model=QueueItemResponse)
async def get_queue_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pobierz element kolejki."""
    service = get_autopilot_service(db)
    item = await service.get_queue_item(item_id, current_user.id)

    if not item:
        raise NotFoundError("Queue item")

    return queue_item_to_response(item)


@router.patch("/queue/{item_id}", response_model=QueueItemResponse)
async def update_queue_item(
    item_id: int,
    data: QueueItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Zaktualizuj element kolejki."""
    service = get_autopilot_service(db)
    item = await service.update_queue_item(item_id, current_user.id, data)

    if not item:
        raise NotFoundError("Queue item")

    await db.commit()
    return queue_item_to_response(item)


@router.post("/queue/{item_id}/approve", response_model=QueueItemResponse)
async def approve_queue_item(
    item_id: int,
    publish_now: bool = Query(False, description="Opublikuj natychmiast po zatwierdzeniu"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Zatwierdź element do publikacji.

    Jeśli publish_now=True lub config.auto_publish_on_approve=True,
    post zostanie opublikowany natychmiast.
    """
    service = get_autopilot_service(db)
    item = await service.approve_item(item_id, current_user.id, publish_immediately=publish_now)

    if not item:
        raise NotFoundError("Queue item")

    await db.commit()
    return queue_item_to_response(item)


@router.post("/queue/{item_id}/reject", response_model=QueueItemResponse)
async def reject_queue_item(
    item_id: int,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Odrzuć element."""
    service = get_autopilot_service(db)
    item = await service.reject_item(item_id, current_user.id, notes)

    if not item:
        raise NotFoundError("Queue item")

    await db.commit()
    return queue_item_to_response(item)


@router.delete("/queue/{item_id}", status_code=204)
async def delete_queue_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Usuń element kolejki."""
    service = get_autopilot_service(db)
    deleted = await service.delete_queue_item(item_id, current_user.id)

    if not deleted:
        raise NotFoundError("Queue item")

    await db.commit()


# === NOWE: PUBLISH ENDPOINTS ===

@router.post("/queue/{item_id}/publish", response_model=PublishResponse)
async def publish_queue_item(
    item_id: int,
    request: PublishRequest = PublishRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Opublikuj pojedynczy element z kolejki.

    Element musi mieć status "approved".
    Jeśli publish_now=False, publikacja nastąpi tylko jeśli scheduled_for <= now.
    """
    autopilot_service = get_autopilot_service(db)
    publish_service = get_publish_service(db)

    # Pobierz element
    item = await autopilot_service.get_queue_item(item_id, current_user.id)
    if not item:
        raise NotFoundError("Queue item")

    # Sprawdź status
    if item.status == "published":
        raise HTTPException(status_code=400, detail="Post already published")

    if item.status not in ("approved", "scheduled"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish post with status '{item.status}'. Approve it first."
        )

    # Opcjonalnie nadpisz social_account_id
    if request.social_account_id:
        item.social_account_id = request.social_account_id
        await db.flush()

    # Publikuj
    result = await publish_service.publish_queue_item(
        item=item,
        force=request.publish_now
    )

    await db.commit()

    return PublishResponse(
        success=result.success,
        item_id=item_id,
        platform=item.platform,
        platform_post_id=result.post_id,
        platform_post_url=result.post_url,
        error=result.error,
        published_at=item.published_at if result.success else None,
        requires_manual = result.requires_manual
    )


@router.post("/configs/{config_id}/publish-ready", response_model=BulkPublishResponse)
async def publish_ready_items(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Opublikuj wszystkie gotowe elementy dla konfiguracji.

    Gotowe = status "approved" + scheduled_for <= now
    """
    autopilot_service = get_autopilot_service(db)
    publish_service = get_publish_service(db)

    config = await autopilot_service.get_config(config_id, current_user.id)
    if not config:
        raise NotFoundError("Config")

    published, failed, results = await publish_service.publish_approved_items(
        config_id=config_id,
        user_id=current_user.id,
        limit=20
    )

    await db.commit()

    return BulkPublishResponse(
        total=published + failed,
        published=published,
        failed=failed,
        results=[
            PublishResponse(
                success=r["success"],
                item_id=r["item_id"],
                platform=r["platform"],
                platform_post_id=r.get("post_id"),
                platform_post_url=r.get("post_url"),
                error=r.get("error"),
                published_at=datetime.utcnow() if r["success"] else None
            )
            for r in results
        ]
    )


@router.post("/configs/{config_id}/retry-failed", response_model=dict)
async def retry_failed_items(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ponów próbę publikacji dla nieudanych postów.

    Dotyczy tylko postów z publish_attempts < 3.
    """
    autopilot_service = get_autopilot_service(db)
    publish_service = get_publish_service(db)

    config = await autopilot_service.get_config(config_id, current_user.id)
    if not config:
        raise NotFoundError("Config")

    success, failed = await publish_service.retry_failed_items(
        config_id=config_id,
        user_id=current_user.id
    )

    await db.commit()

    return {
        "retried": success + failed,
        "success": success,
        "still_failed": failed
    }


# === BULK ACTIONS ===

@router.post("/queue/bulk", response_model=dict)
async def bulk_queue_action(
    data: BulkActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Wykonaj akcję na wielu elementach kolejki.

    Dostępne akcje: approve, reject, delete, publish
    """
    valid_actions = ["approve", "reject", "delete", "publish"]
    if data.action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Valid: {valid_actions}"
        )

    service = get_autopilot_service(db)

    if data.action == "publish":
        # Specjalna obsługa dla publish
        publish_service = get_publish_service(db)
        success = 0
        fail = 0

        for item_id in data.item_ids:
            item = await service.get_queue_item(item_id, current_user.id)
            if item and item.status == "approved":
                result = await publish_service.publish_queue_item(item, force=True)
                if result.success:
                    success += 1
                else:
                    fail += 1
            else:
                fail += 1
    else:
        success, fail = await service.bulk_action(
            data.item_ids,
            current_user.id,
            data.action
        )

    await db.commit()

    return {
        "success_count": success,
        "fail_count": fail,
        "action": data.action,
    }


# === DASHBOARD ===

@router.get("/dashboard/{config_id}", response_model=AutopilotDashboardResponse)
async def get_dashboard(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pobierz pełne dane dashboardu Autopilota."""
    service = get_autopilot_service(db)
    publish_service = get_publish_service(db)

    config = await service.get_config(config_id, current_user.id)
    if not config:
        raise NotFoundError("Config")

    # Pobierz dane
    stats = await service.get_queue_stats(config_id, current_user.id)
    pending = await service.get_pending_items(config_id, current_user.id)
    upcoming = await service.get_upcoming_items(config_id, current_user.id)

    recent_published = await autopilot_repo.get_recent_published_items(db, config_id, current_user.id)

    # NOWE: Failed items
    failed_items = await publish_service.get_failed_items(
        config_id,
        current_user.id,
        limit=10
    )

    # Health score i next post
    health = service.calculate_health_score(config, stats)
    next_post = service.get_next_scheduled_time(config)

    # NOWE: Status kont social
    social_status = await publish_service.validate_social_accounts_for_config(config)

    # Recommendations
    recommendations = []
    if stats.rejection_rate > 30:
        recommendations.append("Wysoki wskaźnik odrzuceń - rozważ dostosowanie Voice DNA marki")
    if stats.average_edit_count > 2:
        recommendations.append("Często edytujesz posty - może warto zmienić ustawienia kreatywności")
    if not config.is_active:
        recommendations.append("Autopilot jest wyłączony - aktywuj go, aby generować treści")
    if stats.pending_count > 10:
        recommendations.append("Masz wiele oczekujących postów do przeglądu")

    # NOWE: Rekomendacje dotyczące social accounts
    missing_accounts = [p for p, s in social_status.items() if s == "missing"]
    expired_accounts = [p for p, s in social_status.items() if s == "expired"]

    if missing_accounts:
        recommendations.append(
            f"Brak połączonych kont dla: {', '.join(missing_accounts)}. "
            "Połącz konta w Ustawieniach."
        )
    if expired_accounts:
        recommendations.append(
            f"Wygasłe tokeny dla: {', '.join(expired_accounts)}. "
            "Połącz konta ponownie."
        )
    if failed_items:
        recommendations.append(
            f"Masz {len(failed_items)} nieudanych publikacji. "
            "Sprawdź błędy i spróbuj ponownie."
        )

    return AutopilotDashboardResponse(
        config=config_to_response(config, health, next_post),
        queue_stats=stats,
        pending_items=[queue_item_to_response(item) for item in pending[:10]],
        upcoming_items=[queue_item_to_response(item) for item in upcoming],
        recent_published=[queue_item_to_response(item) for item in recent_published],
        failed_items=[queue_item_to_response(item) for item in failed_items],
        health_score=health,
        streak_days=config.streak_days,
        next_post_at=next_post,
        recommendations=recommendations,
        social_accounts_status=social_status,
    )


# === DEBUG / TESTING ENDPOINTS ===

@router.post("/debug/trigger-scheduler", include_in_schema=settings.DEBUG)
async def trigger_scheduler(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """[DEBUG] Ręcznie uruchom sprawdzanie harmonogramów generowania."""
    from app.services.scheduler_service import scheduler_service
    await scheduler_service.trigger_generation_check()
    return {"message": "Generation scheduler check triggered", "status": "completed"}


@router.post("/debug/trigger-publish", include_in_schema=settings.DEBUG)
async def trigger_publish_scheduler(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """[DEBUG] Ręcznie uruchom sprawdzanie publikacji."""
    from app.services.scheduler_service import scheduler_service
    await scheduler_service.trigger_publish_check()
    return {"message": "Publish scheduler check triggered", "status": "completed"}


@router.post("/debug/force-generate/{config_id}", include_in_schema=settings.DEBUG)
async def force_generate(
    config_id: int,
    count: int = 1,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """[DEBUG] Wymuś generowanie dla konfiguracji."""
    from app.services.scheduler_service import scheduler_service

    service = get_autopilot_service(db)
    config = await service.get_config(config_id, current_user.id)

    if not config:
        raise NotFoundError("Config")

    await scheduler_service._generate_for_config(db, config)
    return {"message": f"Forced generation for config {config_id}", "status": "completed"}