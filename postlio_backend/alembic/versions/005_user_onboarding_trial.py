"""Add onboarding and trial fields to users

Revision ID: 005_user_onboarding
Revises: 004_autopilot_social
Create Date: 2024-01-16
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timedelta

# revision identifiers, used by Alembic.
revision = '005_user_onboarding'
down_revision = '004_autopilot_social'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Dodaj pola trial i onboarding do tabeli users
    op.add_column(
        'users',
        sa.Column(
            'trial_ends_at',
            sa.DateTime(),
            nullable=True,
            server_default=sa.text(f"NOW() + INTERVAL '14 days'")
        )
    )
    op.add_column(
        'users',
        sa.Column(
            'onboarding_completed_at',
            sa.DateTime(),
            nullable=True
        )
    )
    op.add_column(
        'users',
        sa.Column(
            'onboarding_skipped',
            sa.Boolean(),
            nullable=False,
            server_default='false'
        )
    )

    # Dla istniejących użytkowników - ustaw trial_ends_at na 14 dni od teraz
    # i oznacz onboarding jako pominięty (są już istniejącymi użytkownikami)
    op.execute(
        """
        UPDATE users
        SET trial_ends_at = NOW() + INTERVAL '14 days', onboarding_skipped = true
        WHERE trial_ends_at IS NULL
        """
    )


def downgrade() -> None:
    op.drop_column('users', 'onboarding_skipped')
    op.drop_column('users', 'onboarding_completed_at')
    op.drop_column('users', 'trial_ends_at')