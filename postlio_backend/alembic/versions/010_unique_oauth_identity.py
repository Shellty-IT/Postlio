"""Require each OAuth identity to belong to one user.

Revision ID: 010_unique_oauth_identity
Revises: 009_refresh_tokens
"""

from alembic import op


revision = "010_unique_oauth_identity"
down_revision = "009_refresh_tokens"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_users_oauth_identity", "users", ["oauth_provider", "oauth_provider_id"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_users_oauth_identity", "users", type_="unique")
