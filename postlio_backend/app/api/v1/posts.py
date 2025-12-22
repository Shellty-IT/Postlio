from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.post import Post

router = APIRouter()


@router.get("/")
async def get_posts(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Get all posts for current user."""
    result = await db.execute(
        select(Post).where(Post.user_id == current_user.id).order_by(Post.created_at.desc())
    )
    posts = result.scalars().all()
    return {"posts": posts, "count": len(posts)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_post(
        content: str,
        platform: str,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Create a new post."""
    post = Post(
        user_id=current_user.id,
        content=content,
        platform=platform,
        status="draft",
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


@router.get("/{post_id}")
async def get_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Get a specific post."""
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.user_id == current_user.id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):
    """Delete a post."""
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.user_id == current_user.id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.delete(post)
    await db.commit()