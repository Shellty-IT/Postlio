from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.brand import Brand


class BrandRepository:

    async def get_by_id(self, db: AsyncSession, user_id: int, brand_id: int) -> Optional[Brand]:
        result = await db.execute(
            select(Brand).where(Brand.id == brand_id, Brand.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_brands(
        self,
        db: AsyncSession,
        user_id: int,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Brand]:
        query = select(Brand).where(Brand.user_id == user_id)
        if is_active is not None:
            query = query.where(Brand.is_active == is_active)
        query = query.order_by(Brand.is_default.desc(), Brand.updated_at.desc())
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def count_brands(
        self,
        db: AsyncSession,
        user_id: int,
        is_active: Optional[bool] = None,
    ) -> int:
        query = select(func.count(Brand.id)).where(Brand.user_id == user_id)
        if is_active is not None:
            query = query.where(Brand.is_active == is_active)
        result = await db.execute(query)
        return result.scalar() or 0

    async def get_latest(self, db: AsyncSession, user_id: int) -> Optional[Brand]:
        result = await db.execute(
            select(Brand)
            .where(Brand.user_id == user_id)
            .order_by(Brand.updated_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def clear_default(self, db: AsyncSession, user_id: int) -> None:
        result = await db.execute(
            select(Brand).where(Brand.user_id == user_id, Brand.is_default == True)
        )
        for brand in result.scalars().all():
            brand.is_default = False

    async def create(self, db: AsyncSession, brand: Brand) -> Brand:
        db.add(brand)
        await db.flush()
        await db.refresh(brand)
        return brand

    async def save(self, db: AsyncSession, brand: Brand) -> Brand:
        await db.flush()
        await db.refresh(brand)
        return brand

    async def delete(self, db: AsyncSession, brand: Brand) -> None:
        await db.delete(brand)
        await db.flush()


brand_repo = BrandRepository()
