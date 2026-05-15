# postlio_backend/alembic/versions/007_image_url_to_text.py
"""Change image_url from VARCHAR(500) to TEXT

Revision ID: 007_image_url_to_text
Revises: 006_posts_multi_platform
Create Date: 2025-02-02

Zmiana kolumny image_url z VARCHAR(500) na TEXT
aby obsługiwać base64 encoded images i długie URL-e.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007_image_url_to_text'
down_revision = '006_posts_multi_platform'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Zmień typ kolumny image_url z VARCHAR(500) na TEXT
    op.alter_column(
        'posts',
        'image_url',
        existing_type=sa.VARCHAR(length=500),
        type_=sa.Text(),
        existing_nullable=True
    )


def downgrade() -> None:
    # Uwaga: downgrade może obciąć dane jeśli są dłuższe niż 500 znaków!
    op.alter_column(
        'posts',
        'image_url',
        existing_type=sa.Text(),
        type_=sa.VARCHAR(length=500),
        existing_nullable=True
    )