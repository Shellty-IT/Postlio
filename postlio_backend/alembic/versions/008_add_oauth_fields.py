# alembic/versions/008_add_oauth_fields.py
"""Add OAuth fields to users table

Revision ID: 008_add_oauth_fields
Revises: 007_image_url_to_text
Create Date: 2024-02-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '008_add_oauth_fields'
down_revision: Union[str, None] = '007_image_url_to_text'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Dodaj kolumny OAuth do users
    op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('oauth_provider', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('oauth_provider_id', sa.String(255), nullable=True))


def downgrade() -> None:
    # Usuń kolumny OAuth
    op.drop_column('users', 'oauth_provider_id')
    op.drop_column('users', 'oauth_provider')
    op.drop_column('users', 'avatar_url')