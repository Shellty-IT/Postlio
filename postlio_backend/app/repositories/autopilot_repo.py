from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.autopilot import AutopilotQueueItem


class AutopilotRepository:

    async def get_recent_published_items(
        self,
        db: AsyncSession,
        config_id: int,
        user_id: int,
        limit: int = 10,
    ) -> List[AutopilotQueueItem]:
        result = await db.execute(
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "published")
            .order_by(AutopilotQueueItem.published_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())


autopilot_repo = AutopilotRepository()
