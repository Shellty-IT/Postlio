"""
Add multi-platform support to posts

Revision ID: 006_posts_multi_platform
Revises: 005_user_onboarding
Create Date: 2026-02-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "006_posts_multi_platform"
down_revision = "005_user_onboarding"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "posts",
        sa.Column("platforms", JSONB, nullable=True),
    )
    op.add_column(
        "posts",
        sa.Column("platform_statuses", JSONB, nullable=True),
    )

    op.execute(
        """
        UPDATE posts
        SET
            platforms = jsonb_build_array(platform),
            platform_statuses = jsonb_build_object(
                platform,
                jsonb_build_object(
                    'status', status,
                    'published_at', published_at,
                    'platform_post_id', platform_post_id
                )
            )
        WHERE platform IS NOT NULL
        """
    )

    op.execute(
        """
        UPDATE posts
        SET
            platforms = '["facebook"]'::jsonb,
            platform_statuses = '{
                "facebook": {
                    "status": "draft",
                    "published_at": null,
                    "platform_post_id": null
                }
            }'::jsonb
        WHERE platforms IS NULL
        """
    )

    op.alter_column("posts", "platforms", nullable=False)
    op.alter_column("posts", "platform_statuses", nullable=False)


def downgrade() -> None:
    op.execute(
        """
        UPDATE posts
        SET platform = platforms->>0
        WHERE
            platforms IS NOT NULL
            AND jsonb_array_length(platforms) > 0
        """
    )

    op.drop_column("posts", "platform_statuses")
    op.drop_column("posts", "platforms")
