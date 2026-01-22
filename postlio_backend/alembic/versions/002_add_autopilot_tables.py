# postlio_backend/alembic/versions/002_add_autopilot_tables.py
"""Add autopilot tables

Revision ID: 002_autopilot
Revises: 001_initial
Create Date: 2024-01-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_autopilot'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Autopilot Configs
    op.create_table(
        'autopilot_configs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),

        # Status
        sa.Column('is_active', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_paused', sa.Boolean(), nullable=False, default=False),

        # Schedule
        sa.Column('posts_per_week', sa.Integer(), nullable=False, default=3),
        sa.Column('schedule_days', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('schedule_time', sa.String(5), nullable=False, default='10:00'),
        sa.Column('timezone', sa.String(50), nullable=False, default='Europe/Warsaw'),

        # Platforms & Categories
        sa.Column('platforms', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('categories', postgresql.JSON(astext_type=sa.Text()), nullable=True),

        # Generation settings
        sa.Column('creativity_level', sa.Integer(), nullable=False, default=50),
        sa.Column('post_length', sa.String(10), nullable=False, default='medium'),
        sa.Column('include_images', sa.Boolean(), nullable=False, default=True),
        sa.Column('include_hashtags', sa.Boolean(), nullable=False, default=True),
        sa.Column('include_emoji', sa.Boolean(), nullable=False, default=True),

        # AI preferences
        sa.Column('text_provider', sa.String(20), nullable=False, default='gemini'),
        sa.Column('image_provider', sa.String(20), nullable=False, default='pollinations'),
        sa.Column('image_style', sa.String(20), nullable=False, default='realistic'),

        # Stats
        sa.Column('total_generated', sa.Integer(), nullable=False, default=0),
        sa.Column('total_approved', sa.Integer(), nullable=False, default=0),
        sa.Column('total_rejected', sa.Integer(), nullable=False, default=0),
        sa.Column('total_published', sa.Integer(), nullable=False, default=0),
        sa.Column('streak_days', sa.Integer(), nullable=False, default=0),
        sa.Column('last_generation_at', sa.DateTime(), nullable=True),
        sa.Column('last_published_at', sa.DateTime(), nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['brand_id'], ['brands.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('brand_id'),
    )
    op.create_index('ix_autopilot_configs_user_id', 'autopilot_configs', ['user_id'])
    op.create_index('ix_autopilot_configs_brand_id', 'autopilot_configs', ['brand_id'])

    # Autopilot Queue
    op.create_table(
        'autopilot_queue',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('config_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),

        # Content
        sa.Column('platform', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('hashtags', postgresql.JSON(astext_type=sa.Text()), nullable=True),

        # Metadata
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('topic_used', sa.String(500), nullable=True),

        # Status & Schedule
        sa.Column('status', sa.String(20), nullable=False, default='pending'),
        sa.Column('scheduled_for', sa.DateTime(), nullable=False),
        sa.Column('published_at', sa.DateTime(), nullable=True),

        # AI info
        sa.Column('text_provider_used', sa.String(20), nullable=True),
        sa.Column('image_provider_used', sa.String(20), nullable=True),
        sa.Column('generation_params', postgresql.JSON(astext_type=sa.Text()), nullable=True),

        # Feedback
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('edit_count', sa.Integer(), nullable=False, default=0),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['config_id'], ['autopilot_configs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['brand_id'], ['brands.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_autopilot_queue_config_id', 'autopilot_queue', ['config_id'])
    op.create_index('ix_autopilot_queue_user_id', 'autopilot_queue', ['user_id'])
    op.create_index('ix_autopilot_queue_status', 'autopilot_queue', ['status'])
    op.create_index('ix_autopilot_queue_scheduled_for', 'autopilot_queue', ['scheduled_for'])


def downgrade() -> None:
    op.drop_table('autopilot_queue')
    op.drop_table('autopilot_configs')