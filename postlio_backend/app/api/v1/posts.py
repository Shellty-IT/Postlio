# app/api/v1/posts.py
"""
Posts API - obsługa wielu platform na post

Każdy post może mieć wiele platform (platforms[]) i osobny status per platforma (platform_statuses{}).
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.post import Post, PostStatus, Platform
from app.schemas.post import (
    PostCreate,
    PostUpdate,
    PostResponse,
    PostsListResponse,
    PostSchedule,
    CalendarEventResponse,
)

router = APIRouter()


# ============ SCHEMAS DLA NOWYCH ENDPOINTÓW ============

class PlatformStatusUpdate(BaseModel):
    """Update statusu publikacji dla konkretnej platformy"""
    platform: str
    status: str  # "draft", "published", "failed"
    platform_post_id: Optional[str] = None


# ============ CALENDAR ENDPOINT (MUST BE BEFORE /{post_id}) ============

@router.get("/calendar", response_model=List[CalendarEventResponse])
async def get_calendar_events(
        start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
        end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
        brand_id: Optional[int] = Query(None, description="Filter by brand ID"),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """
    Get posts for calendar view.
    Returns posts that have scheduled_at within the date range.
    Now supports multiple platforms per post.
    """
    try:
        if "T" in start_date:
            start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        else:
            start = datetime.fromisoformat(f"{start_date}T00:00:00")

        if "T" in end_date:
            end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        else:
            end = datetime.fromisoformat(f"{end_date}T23:59:59")
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format. Use YYYY-MM-DD or ISO format. Error: {str(e)}"
        )

    query = select(Post).where(
        and_(
            Post.user_id == current_user.id,
            Post.scheduled_at.isnot(None),
            Post.scheduled_at >= start,
            Post.scheduled_at <= end,
        )
    )

    if brand_id:
        query = query.where(Post.brand_id == brand_id)

    query = query.order_by(Post.scheduled_at)

    result = await db.execute(query)
    posts = result.scalars().all()

    events = []
    for post in posts:
        title = post.content[:50] + "..." if post.content and len(post.content) > 50 else (post.content or "")

        # Użyj nowego pola platforms[], fallback do legacy platform
        platforms_list = post.platforms if post.platforms else ([post.platform] if post.platform else [])

        events.append(CalendarEventResponse(
            id=str(post.id),
            post_id=str(post.id),
            title=title.replace("\n", " "),
            date=post.scheduled_at.strftime("%Y-%m-%d"),
            time=post.scheduled_at.strftime("%H:%M"),
            platforms=platforms_list,
            platform_statuses=post.platform_statuses or {},
            status=post.get_overall_status() if hasattr(post, 'get_overall_status') else post.status,
            preview=post.content[:150] if post.content else None,
            image_url=post.image_url,
            brand_id=post.brand_id,
        ))

    return events


# ============ STATS ENDPOINT ============

@router.get("/stats")
async def get_posts_stats(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Get post statistics for current user."""
    total_result = await db.execute(
        select(Post).where(Post.user_id == current_user.id)
    )
    total_posts = len(total_result.scalars().all())

    stats_by_status = {}
    for status_val in PostStatus:
        result = await db.execute(
            select(Post).where(
                Post.user_id == current_user.id,
                Post.status == status_val.value
            )
        )
        stats_by_status[status_val.value] = len(result.scalars().all())

    now = datetime.utcnow()
    scheduled_result = await db.execute(
        select(Post).where(
            Post.user_id == current_user.id,
            Post.status == PostStatus.SCHEDULED.value,
            Post.scheduled_at > now
        )
    )
    upcoming_scheduled = len(scheduled_result.scalars().all())

    return {
        "total": total_posts,
        "by_status": stats_by_status,
        "upcoming_scheduled": upcoming_scheduled,
    }


# ============ CRUD ENDPOINTS ============

@router.get("/", response_model=PostsListResponse)
async def get_posts(
        status: Optional[str] = Query(None, description="Filter by status"),
        platform: Optional[str] = Query(None, description="Filter by platform"),
        brand_id: Optional[int] = Query(None, description="Filter by brand"),
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Get all posts for current user with optional filters."""
    query = select(Post).where(Post.user_id == current_user.id)

    if status:
        query = query.where(Post.status == status)
    if platform:
        # Filtruj po platforms[] (JSONB contains) lub legacy platform
        query = query.where(
            Post.platforms.contains([platform]) | (Post.platform == platform)
        )
    if brand_id:
        query = query.where(Post.brand_id == brand_id)

    query = query.order_by(Post.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    posts = result.scalars().all()

    count_query = select(Post).where(Post.user_id == current_user.id)
    if status:
        count_query = count_query.where(Post.status == status)
    if platform:
        count_query = count_query.where(
            Post.platforms.contains([platform]) | (Post.platform == platform)
        )
    if brand_id:
        count_query = count_query.where(Post.brand_id == brand_id)

    count_result = await db.execute(count_query)
    total_count = len(count_result.scalars().all())

    return PostsListResponse(
        posts=[PostResponse.model_validate(post) for post in posts],
        count=total_count
    )


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
        post_data: PostCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """
    Create a new post with multiple platforms support.

    - platforms: lista platform docelowych ["facebook", "instagram"]
    - platform_statuses: automatycznie inicjalizowane jako {"facebook": {"status": "draft"}, ...}
    """
    initial_status = PostStatus.SCHEDULED.value if post_data.scheduled_at else PostStatus.DRAFT.value

    # Pobierz listę platform (z nowego pola lub legacy)
    platforms_list = [p.value if hasattr(p, 'value') else p for p in post_data.platforms]

    # Inicjalizuj platform_statuses dla każdej platformy
    initial_platform_statuses = {
        platform: {
            "status": "scheduled" if post_data.scheduled_at else "draft",
            "published_at": None,
            "platform_post_id": None
        }
        for platform in platforms_list
    }

    # Legacy: zachowaj pierwszą platformę w starym polu dla kompatybilności
    legacy_platform = platforms_list[0] if platforms_list else None

    post = Post(
        user_id=current_user.id,
        brand_id=post_data.brand_id,
        content=post_data.content,
        platform=legacy_platform,  # Legacy field
        platforms=platforms_list,  # Nowe pole
        platform_statuses=initial_platform_statuses,  # Nowe pole
        image_url=post_data.image_url,
        image_prompt=post_data.image_prompt,
        status=initial_status,
        scheduled_at=post_data.scheduled_at,
        ai_generated=post_data.ai_generated,
        ai_model=post_data.ai_model,
        generation_params=post_data.generation_params,
    )

    db.add(post)
    await db.commit()
    await db.refresh(post)

    return PostResponse.model_validate(post)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Get a specific post."""
    result = await db.execute(
        select(Post).where(
            Post.id == post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return PostResponse.model_validate(post)


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
        post_id: int,
        post_data: PostUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Update a post."""
    result = await db.execute(
        select(Post).where(
            Post.id == post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    update_data = post_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "platform" and value:
            value = value.value if hasattr(value, 'value') else value
        if field == "platforms" and value:
            # Konwertuj enumy na stringi
            value = [p.value if hasattr(p, 'value') else p for p in value]
            # Aktualizuj też legacy platform
            if value:
                setattr(post, "platform", value[0])
        if field == "status" and value:
            value = value.value if hasattr(value, 'value') else value
        setattr(post, field, value)

    post.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(post)

    return PostResponse.model_validate(post)


@router.patch("/{post_id}/platform-status", response_model=PostResponse)
async def update_platform_status(
        post_id: int,
        status_update: PlatformStatusUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """
    Update publication status for a specific platform.

    Used when user clicks "Opublikowałem" in manual publish modal.
    """
    result = await db.execute(
        select(Post).where(
            Post.id == post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Sprawdź czy platforma jest w liście platform posta
    if post.platforms and status_update.platform not in post.platforms:
        raise HTTPException(
            status_code=400,
            detail=f"Platform {status_update.platform} is not in post's platforms list"
        )

    # Użyj metody modelu do aktualizacji
    published_at = datetime.utcnow() if status_update.status == "published" else None
    post.set_platform_status(
        platform=status_update.platform,
        status=status_update.status,
        published_at=published_at,
        platform_post_id=status_update.platform_post_id
    )

    # Aktualizuj główny status na podstawie wszystkich platform
    post.status = post.get_overall_status()
    post.updated_at = datetime.utcnow()

    # Jeśli wszystko opublikowane, ustaw published_at
    if post.is_fully_published():
        post.published_at = datetime.utcnow()

    await db.commit()
    await db.refresh(post)

    return PostResponse.model_validate(post)


@router.post("/{post_id}/schedule", response_model=PostResponse)
async def schedule_post(
        post_id: int,
        schedule_data: PostSchedule,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Schedule a post for publishing."""
    result = await db.execute(
        select(Post).where(
            Post.id == post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if schedule_data.scheduled_at <= datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Scheduled time must be in the future"
        )

    post.scheduled_at = schedule_data.scheduled_at
    post.status = PostStatus.SCHEDULED.value

    # Aktualizuj platform_statuses
    if post.platforms:
        for platform in post.platforms:
            post.set_platform_status(platform, "scheduled")

    post.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(post)

    return PostResponse.model_validate(post)


@router.post("/{post_id}/unschedule", response_model=PostResponse)
async def unschedule_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Remove scheduling from a post (move back to draft)."""
    result = await db.execute(
        select(Post).where(
            Post.id == post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.scheduled_at = None
    post.status = PostStatus.DRAFT.value

    # Aktualizuj platform_statuses
    if post.platforms:
        for platform in post.platforms:
            post.set_platform_status(platform, "draft")

    post.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(post)

    return PostResponse.model_validate(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Delete a post."""
    result = await db.execute(
        select(Post).where(
            Post.id == post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.delete(post)
    await db.commit()


# ============ DRAFTS ENDPOINTS ============

@router.get("/drafts/list", response_model=PostsListResponse)
async def get_drafts(
        brand_id: Optional[int] = None,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Get all draft posts."""
    query = select(Post).where(
        Post.user_id == current_user.id,
        Post.status == PostStatus.DRAFT.value
    )

    if brand_id:
        query = query.where(Post.brand_id == brand_id)

    query = query.order_by(Post.updated_at.desc())

    result = await db.execute(query)
    posts = result.scalars().all()

    return PostsListResponse(
        posts=[PostResponse.model_validate(post) for post in posts],
        count=len(posts)
    )