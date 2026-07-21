# app/services/refresh_token_service.py
"""
Zarządzanie sesjami refresh tokenów - rotacja i unieważnianie.

Refresh token sam w sobie pozostaje bezstanowym JWT (podpis weryfikowany
lokalnie), ale jego "jti" jest rejestrowane tutaj, żeby dało się:
- odrzucić token, którego jti nigdy nie zostało wydane albo już wygasło z bazy,
- rozpoznać reuse już zrotowanego tokena (możliwa kradzież) i unieważnić
  całą rodzinę sesji użytkownika,
- realnie wylogować (logout unieważnia konkretną sesję po stronie serwera,
  a nie tylko czyści cookie po stronie klienta).
"""
from datetime import datetime
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken
from app.utils.security import create_tokens, decode_token


async def issue_tokens(db: AsyncSession, user_id: int) -> Tuple[str, str]:
    """Utwórz parę access+refresh token i zarejestruj jti nowego refresh tokena."""
    access_token, refresh_token = create_tokens(user_id)

    payload = decode_token(refresh_token)
    db.add(RefreshToken(
        user_id=user_id,
        jti=payload["jti"],
        expires_at=datetime.utcfromtimestamp(payload["exp"]),
    ))

    return access_token, refresh_token


async def get_by_jti(db: AsyncSession, jti: str) -> Optional[RefreshToken]:
    result = await db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
    return result.scalar_one_or_none()


async def revoke(record: RefreshToken) -> None:
    """Unieważnij pojedynczy rekord (rotacja albo logout)."""
    if record.revoked_at is None:
        record.revoked_at = datetime.utcnow()


async def revoke_all_for_user(db: AsyncSession, user_id: int) -> None:
    """
    Unieważnij wszystkie aktywne sesje użytkownika.

    Używane, gdy wykryty zostanie reuse już zrotowanego refresh tokena -
    to sygnał, że token mógł zostać skradziony, więc lepiej wylogować
    wszystkie urządzenia niż zaufać któremukolwiek z nich.
    """
    result = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.user_id == user_id)
        .where(RefreshToken.revoked_at.is_(None))
    )
    now = datetime.utcnow()
    for record in result.scalars().all():
        record.revoked_at = now
