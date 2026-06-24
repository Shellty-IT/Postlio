from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.post import Post, PostStatus


class PostRepository:

    async def get_by_id(self, db: AsyncSession, user_id: int, post_id: int) -> Optional[Post]:
        result = await db.execute(
            select(Post).where(Post.id == post_id, Post.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_posts(
        self,
        db: AsyncSession,
        user_id: int,
        status: Optional[str] = None,
        platform: Optional[str] = None,
        brand_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Post]:
        query = self._base_query(user_id)
        query = self._apply_filters(query, status, platform, brand_id)
        query = query.order_by(Post.created_at.desc()).offset(offset).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def count_posts(
        self,
        db: AsyncSession,
        user_id: int,
        status: Optional[str] = None,
        platform: Optional[str] = None,
        brand_id: Optional[int] = None,
    ) -> int:
        query = select(func.count()).select_from(Post).where(Post.user_id == user_id)
        query = self._apply_filters(query, status, platform, brand_id)
        result = await db.execute(query)
        return result.scalar() or 0

    async def get_calendar_events(
        self,
        db: AsyncSession,
        user_id: int,
        start: datetime,
        end: datetime,
        brand_id: Optional[int] = None,
    ) -> List[Post]:
        query = select(Post).where(
            and_(
                Post.user_id == user_id,
                Post.scheduled_at.isnot(None),
                Post.scheduled_at >= start,
                Post.scheduled_at <= end,
            )
        )
        if brand_id:
            query = query.where(Post.brand_id == brand_id)
        query = query.order_by(Post.scheduled_at)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_stats(self, db: AsyncSession, user_id: int) -> Dict:
        total_result = await db.execute(
            select(func.count()).select_from(Post).where(Post.user_id == user_id)
        )
        total = total_result.scalar() or 0

        by_status: Dict[str, int] = {}
        for status_val in PostStatus:
            count_result = await db.execute(
                select(func.count()).select_from(Post).where(
                    Post.user_id == user_id,
                    Post.status == status_val.value,
                )
            )
            by_status[status_val.value] = count_result.scalar() or 0

        upcoming_result = await db.execute(
            select(func.count()).select_from(Post).where(
                Post.user_id == user_id,
                Post.status == PostStatus.SCHEDULED.value,
                Post.scheduled_at > datetime.utcnow(),
            )
        )
        upcoming_scheduled = upcoming_result.scalar() or 0

        return {"total": total, "by_status": by_status, "upcoming_scheduled": upcoming_scheduled}

    async def get_drafts(
        self,
        db: AsyncSession,
        user_id: int,
        brand_id: Optional[int] = None,
    ) -> List[Post]:
        query = select(Post).where(
            Post.user_id == user_id,
            Post.status == PostStatus.DRAFT.value,
        )
        if brand_id:
            query = query.where(Post.brand_id == brand_id)
        query = query.order_by(Post.updated_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, post: Post) -> Post:
        db.add(post)
        await db.commit()
        await db.refresh(post)
        return post

    async def save(self, db: AsyncSession, post: Post) -> Post:
        await db.commit()
        await db.refresh(post)
        return post

    async def delete(self, db: AsyncSession, post: Post) -> None:
        await db.delete(post)
        await db.commit()

    def _base_query(self, user_id: int):
        return select(Post).where(Post.user_id == user_id)

    def _apply_filters(self, query, status, platform, brand_id):
        if status:
            query = query.where(Post.status == status)
        if platform:
            query = query.where(
                Post.platforms.contains([platform]) | (Post.platform == platform)
            )
        if brand_id:
            query = query.where(Post.brand_id == brand_id)
        return query


post_repo = PostRepository()
