from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.social_account import SocialAccount
from app.api.exceptions import NotFoundError


class SocialRepository:

    async def get_by_id(self, db: AsyncSession, user_id: int, account_id: int) -> SocialAccount:
        """Returns account or raises NotFoundError."""
        result = await db.execute(
            select(SocialAccount).where(
                and_(SocialAccount.id == account_id, SocialAccount.user_id == user_id)
            )
        )
        account = result.scalar_one_or_none()
        if not account:
            raise NotFoundError("Account")
        return account

    async def find_existing(
        self,
        db: AsyncSession,
        user_id: int,
        platform: str,
        platform_user_id: str,
    ) -> Optional[SocialAccount]:
        result = await db.execute(
            select(SocialAccount).where(
                and_(
                    SocialAccount.user_id == user_id,
                    SocialAccount.platform == platform,
                    SocialAccount.platform_user_id == platform_user_id,
                )
            )
        )
        return result.scalars().first()

    async def list_accounts(self, db: AsyncSession, user_id: int) -> List[SocialAccount]:
        result = await db.execute(
            select(SocialAccount).where(SocialAccount.user_id == user_id)
        )
        return list(result.scalars().all())

    async def save(self, db: AsyncSession, account: SocialAccount) -> SocialAccount:
        await db.commit()
        await db.refresh(account)
        return account

    async def create(self, db: AsyncSession, account: SocialAccount) -> SocialAccount:
        db.add(account)
        await db.commit()
        await db.refresh(account)
        return account

    async def delete(self, db: AsyncSession, account: SocialAccount) -> None:
        await db.delete(account)
        await db.commit()


social_repo = SocialRepository()
