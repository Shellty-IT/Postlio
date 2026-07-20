# app/api/v1/posts.py
from datetime import datetime
from typing import Dict, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.api.exceptions import NotFoundError
from app.models.user import User
from app.models.post import Post, PostStatus
from app.models.social_account import SocialAccount
from app.repositories import post_repo
from app.schemas.post import (
    PostCreate,
    PostUpdate,
    PostResponse,
    PostsListResponse,
    PostSchedule,
    CalendarEventResponse,
)
from app.services.publish_service import AUTO_PUBLISH_ACCOUNT_TYPES

router = APIRouter(prefix="/posts", tags=["Posts"])


class PlatformStatusUpdate(BaseModel):
    platform: str
    status: str
    platform_post_id: Optional[str] = None


async def _build_platform_auto_publish_map(db: AsyncSession, user_id: int) -> Dict[str, bool]:
    """Dla kazdej platformy: czy uzytkownik ma podlaczone choc jedno konto,
    ktore wspiera automatyczna publikacje (Etap 1 - AUTO_PUBLISH_ACCOUNT_TYPES,
    jedyne zrodlo prawdy). Jedno zapytanie dla calego widoku kalendarza zamiast
    N+1 per post/queue-item.
    """
    result = await db.execute(
        select(SocialAccount.platform, SocialAccount.account_type)
        .where(SocialAccount.user_id == user_id)
        .where(SocialAccount.is_active)
    )
    capability_map: Dict[str, bool] = {}
    for platform, account_type in result.all():
        if account_type in AUTO_PUBLISH_ACCOUNT_TYPES:
            capability_map[platform] = True
        else:
            capability_map.setdefault(platform, False)
    return capability_map


def _requires_manual_publish(platforms: List[str], capability_map: Dict[str, bool]) -> bool:
    """Post/queue-item wymaga recznej publikacji, jesli KTORAKOLWIEK z jego
    platform nie ma podlaczonego konta zdolnego do auto-publikacji."""
    return not all(capability_map.get(p, False) for p in platforms)


def _autopilot_item_to_event(item, capability_map: Dict[str, bool]) -> CalendarEventResponse:
    """Mapuje element kolejki Autopilota na wydarzenie Kalendarza.

    UWAGA na status: kolejka Autopilota ma wlasny slownik statusow
    ("approved"/"scheduled"), ktory NIE pokrywa sie ze statusami posta
    rozumianymi przez Kalendarz (draft/scheduled/publishing/published/failed).
    Z punktu widzenia Kalendarza zatwierdzony element czekajacy na swoja
    godzine to po prostu post zaplanowany - bez tego mapowania frontend
    wpada w fallback i pokazuje go uzytkownikowi jako "Szkic".
    """
    title = (item.content[:50] + "...") if item.content and len(item.content) > 50 else (item.content or "")
    platforms_list = [item.platform] if item.platform else []
    return CalendarEventResponse(
        id=f"autopilot-{item.id}",
        post_id=str(item.id),
        title=title.replace("\n", " "),
        date=item.scheduled_for.strftime("%Y-%m-%d"),
        time=item.scheduled_for.strftime("%H:%M"),
        platforms=platforms_list,
        platform_statuses={},
        status=PostStatus.SCHEDULED.value,
        preview=item.content[:150] if item.content else None,
        image_url=item.image_url,
        brand_id=item.brand_id,
        origin="autopilot",
        requires_manual_publish=_requires_manual_publish(platforms_list, capability_map),
    )


@router.get("/calendar", response_model=List[CalendarEventResponse])
async def get_calendar_events(
        start_date: str = Query(...),
        end_date: str = Query(...),
        brand_id: Optional[int] = Query(None),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    try:
        start = datetime.fromisoformat(
            start_date.replace("Z", "+00:00") if "T" in start_date else f"{start_date}T00:00:00"
        )
        end = datetime.fromisoformat(
            end_date.replace("Z", "+00:00") if "T" in end_date else f"{end_date}T23:59:59"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")

    posts = await post_repo.get_calendar_events(db, current_user.id, start, end, brand_id)
    autopilot_items = await post_repo.get_calendar_autopilot_items(db, current_user.id, start, end)
    capability_map = await _build_platform_auto_publish_map(db, current_user.id)

    events = []
    for post in posts:
        title = (post.content[:50] + "...") if post.content and len(post.content) > 50 else (post.content or "")
        platforms_list = post.platforms if post.platforms else ([post.platform] if post.platform else [])
        events.append(CalendarEventResponse(
            id=str(post.id),
            post_id=str(post.id),
            title=title.replace("\n", " "),
            date=post.scheduled_at.strftime("%Y-%m-%d"),
            time=post.scheduled_at.strftime("%H:%M"),
            platforms=platforms_list,
            platform_statuses=post.platform_statuses or {},
            status=post.get_overall_status() if hasattr(post, "get_overall_status") else post.status,
            preview=post.content[:150] if post.content else None,
            image_url=post.image_url,
            brand_id=post.brand_id,
            origin="manual",
            requires_manual_publish=_requires_manual_publish(platforms_list, capability_map),
        ))

    # Autopilot ma osobna tabele (AutopilotQueueItem) - jesli filtrujemy po marce,
    # queue-itemy tej marki tez musza przejsc przez ten sam filtr co posty.
    for item in autopilot_items:
        if brand_id and item.brand_id != brand_id:
            continue
        events.append(_autopilot_item_to_event(item, capability_map))

    events.sort(key=lambda e: (e.date, e.time))
    return events


@router.get("/stats")
async def get_posts_stats(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    return await post_repo.get_stats(db, current_user.id)


@router.get("/", response_model=PostsListResponse)
async def get_posts(
        status: Optional[str] = Query(None),
        platform: Optional[str] = Query(None),
        brand_id: Optional[int] = Query(None),
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    posts = await post_repo.list_posts(db, current_user.id, status, platform, brand_id, limit, offset)
    total = await post_repo.count_posts(db, current_user.id, status, platform, brand_id)
    return PostsListResponse(
        posts=[PostResponse.model_validate(p) for p in posts],
        count=total,
    )


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
        post_data: PostCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    initial_status = PostStatus.SCHEDULED.value if post_data.scheduled_at else PostStatus.DRAFT.value
    platforms_list = [p.value if hasattr(p, "value") else p for p in post_data.platforms]
    initial_platform_statuses = {
        platform: {
            "status": "scheduled" if post_data.scheduled_at else "draft",
            "published_at": None,
            "platform_post_id": None,
        }
        for platform in platforms_list
    }
    post = Post(
        user_id=current_user.id,
        brand_id=post_data.brand_id,
        content=post_data.content,
        platform=platforms_list[0] if platforms_list else None,
        platforms=platforms_list,
        platform_statuses=initial_platform_statuses,
        image_url=post_data.image_url,
        image_prompt=post_data.image_prompt,
        status=initial_status,
        scheduled_at=post_data.scheduled_at,
        ai_generated=post_data.ai_generated,
        ai_model=post_data.ai_model,
        generation_params=post_data.generation_params,
    )
    post = await post_repo.create(db, post)
    return PostResponse.model_validate(post)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    post = await post_repo.get_by_id(db, current_user.id, post_id)
    if not post:
        raise NotFoundError("Post")
    return PostResponse.model_validate(post)


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
        post_id: int,
        post_data: PostUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    post = await post_repo.get_by_id(db, current_user.id, post_id)
    if not post:
        raise NotFoundError("Post")

    update_data = post_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "platform" and value:
            value = value.value if hasattr(value, "value") else value
        if field == "platforms" and value:
            value = [p.value if hasattr(p, "value") else p for p in value]
            if value:
                setattr(post, "platform", value[0])
        if field == "status" and value:
            value = value.value if hasattr(value, "value") else value
        setattr(post, field, value)

    post.updated_at = datetime.utcnow()
    return PostResponse.model_validate(await post_repo.save(db, post))


@router.patch("/{post_id}/platform-status", response_model=PostResponse)
async def update_platform_status(
        post_id: int,
        status_update: PlatformStatusUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    post = await post_repo.get_by_id(db, current_user.id, post_id)
    if not post:
        raise NotFoundError("Post")

    if post.platforms and status_update.platform not in post.platforms:
        raise HTTPException(
            status_code=400,
            detail=f"Platform {status_update.platform} is not in post's platforms list",
        )

    published_at = datetime.utcnow() if status_update.status == "published" else None
    post.set_platform_status(
        platform=status_update.platform,
        status=status_update.status,
        published_at=published_at,
        platform_post_id=status_update.platform_post_id,
    )
    post.status = post.get_overall_status()
    post.updated_at = datetime.utcnow()
    if post.is_fully_published():
        post.published_at = datetime.utcnow()

    return PostResponse.model_validate(await post_repo.save(db, post))


@router.post("/{post_id}/schedule", response_model=PostResponse)
async def schedule_post(
        post_id: int,
        schedule_data: PostSchedule,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    post = await post_repo.get_by_id(db, current_user.id, post_id)
    if not post:
        raise NotFoundError("Post")

    if schedule_data.scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

    post.scheduled_at = schedule_data.scheduled_at
    post.status = PostStatus.SCHEDULED.value
    if post.platforms:
        for platform in post.platforms:
            post.set_platform_status(platform, "scheduled")
    post.updated_at = datetime.utcnow()

    return PostResponse.model_validate(await post_repo.save(db, post))


@router.post("/{post_id}/unschedule", response_model=PostResponse)
async def unschedule_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    post = await post_repo.get_by_id(db, current_user.id, post_id)
    if not post:
        raise NotFoundError("Post")

    post.scheduled_at = None
    post.status = PostStatus.DRAFT.value
    if post.platforms:
        for platform in post.platforms:
            post.set_platform_status(platform, "draft")
    post.updated_at = datetime.utcnow()

    return PostResponse.model_validate(await post_repo.save(db, post))


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    post = await post_repo.get_by_id(db, current_user.id, post_id)
    if not post:
        raise NotFoundError("Post")
    await post_repo.delete(db, post)


@router.get("/drafts/list", response_model=PostsListResponse)
async def get_drafts(
        brand_id: Optional[int] = None,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    posts = await post_repo.get_drafts(db, current_user.id, brand_id)
    return PostsListResponse(
        posts=[PostResponse.model_validate(p) for p in posts],
        count=len(posts),
    )
