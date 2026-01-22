# postlio_backend/alembic/versions/004_autopilot_social_integration.py
"""Add social media integration to autopilot

Revision ID: 004_autopilot_social
Revises: 003_social_accounts
Create Date: 2024-01-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_autopilot_social'
down_revision = '003_social_accounts'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === AutopilotConfig: Dodaj mapowanie kont social ===
    op.add_column(
        'autopilot_configs',
        sa.Column('social_account_mapping', sa.JSON(), nullable=True, server_default='{}')
    )
    op.add_column(
        'autopilot_configs',
        sa.Column('auto_publish_on_approve', sa.Boolean(), nullable=True, server_default='false')
    )

    # === AutopilotQueueItem: Dodaj pola publikacji ===
    op.add_column(
        'autopilot_queue',
        sa.Column('social_account_id', sa.Integer(), nullable=True)
    )
    op.add_column(
        'autopilot_queue',
        sa.Column('platform_post_id', sa.String(255), nullable=True)
    )
    op.add_column(
        'autopilot_queue',
        sa.Column('platform_post_url', sa.String(500), nullable=True)
    )
    op.add_column(
        'autopilot_queue',
        sa.Column('publish_error', sa.Text(), nullable=True)
    )
    op.add_column(
        'autopilot_queue',
        sa.Column('publish_attempts', sa.Integer(), nullable=True, server_default='0')
    )
    op.add_column(
        'autopilot_queue',
        sa.Column('last_publish_attempt_at', sa.DateTime(), nullable=True)
    )

    # Dodaj foreign key dla social_account_id
    op.create_foreign_key(
        'fk_autopilot_queue_social_account',
        'autopilot_queue',
        'social_accounts',
        ['social_account_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Usuń foreign key
    op.drop_constraint('fk_autopilot_queue_social_account', 'autopilot_queue', type_='foreignkey')

    # Usuń kolumny z autopilot_queue
    op.drop_column('autopilot_queue', 'last_publish_attempt_at')
    op.drop_column('autopilot_queue', 'publish_attempts')
    op.drop_column('autopilot_queue', 'publish_error')
    op.drop_column('autopilot_queue', 'platform_post_url')
    op.drop_column('autopilot_queue', 'platform_post_id')
    op.drop_column('autopilot_queue', 'social_account_id')

    # Usuń kolumny z autopilot_configs
    op.drop_column('autopilot_configs', 'auto_publish_on_approve')
    op.drop_column('autopilot_configs', 'social_account_mapping')