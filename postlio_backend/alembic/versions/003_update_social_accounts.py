# postlio_backend/alembic/versions/003_update_social_accounts.py
"""Update social_accounts table

Revision ID: 003_social_accounts
Revises: 002_autopilot
Create Date: 2024-01-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_social_accounts'
down_revision = '002_autopilot'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Zmień typy kolumn tokenów na Text
    op.alter_column('social_accounts', 'access_token',
                    existing_type=sa.String(1000),
                    type_=sa.Text(),
                    existing_nullable=False)

    op.alter_column('social_accounts', 'refresh_token',
                    existing_type=sa.String(1000),
                    type_=sa.Text(),
                    existing_nullable=True)

    # Dodaj nowe kolumny
    op.add_column('social_accounts',
                  sa.Column('account_type', sa.String(50), nullable=True))

    op.add_column('social_accounts',
                  sa.Column('page_id', sa.String(255), nullable=True))

    op.add_column('social_accounts',
                  sa.Column('page_name', sa.String(255), nullable=True))

    op.add_column('social_accounts',
                  sa.Column('page_access_token', sa.Text(), nullable=True))

    op.add_column('social_accounts',
                  sa.Column('instagram_account_id', sa.String(255), nullable=True))

    op.add_column('social_accounts',
                  sa.Column('connected_fb_page_id', sa.String(255), nullable=True))

    op.add_column('social_accounts',
                  sa.Column('last_used_at', sa.DateTime(), nullable=True))

    op.add_column('social_accounts',
                  sa.Column('last_error', sa.Text(), nullable=True))

    op.add_column('social_accounts',
                  sa.Column('posts_published', sa.Integer(), server_default='0'))

    # Ustaw domyślne account_type dla istniejących rekordów
    op.execute("""
        UPDATE social_accounts 
        SET account_type = CASE 
            WHEN platform = 'facebook' THEN 'facebook_page'
            WHEN platform = 'instagram' THEN 'instagram_business'
            WHEN platform = 'linkedin' THEN 'linkedin_profile'
            ELSE 'facebook_page'
        END
        WHERE account_type IS NULL
    """)

    # Ustaw kolumnę jako NOT NULL
    op.alter_column('social_accounts', 'account_type',
                    existing_type=sa.String(50),
                    nullable=False)


def downgrade() -> None:
    op.drop_column('social_accounts', 'posts_published')
    op.drop_column('social_accounts', 'last_error')
    op.drop_column('social_accounts', 'last_used_at')
    op.drop_column('social_accounts', 'connected_fb_page_id')
    op.drop_column('social_accounts', 'instagram_account_id')
    op.drop_column('social_accounts', 'page_access_token')
    op.drop_column('social_accounts', 'page_name')
    op.drop_column('social_accounts', 'page_id')
    op.drop_column('social_accounts', 'account_type')

    op.alter_column('social_accounts', 'refresh_token',
                    existing_type=sa.Text(),
                    type_=sa.String(1000),
                    existing_nullable=True)

    op.alter_column('social_accounts', 'access_token',
                    existing_type=sa.Text(),
                    type_=sa.String(1000),
                    existing_nullable=False)