"""
Security utilities for authentication and password handling.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


# Alias for compatibility with tests
get_password_hash = hash_password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Optional[Dict[str, Any]] = None,
    user_id: Optional[int] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token.

    Supports two calling conventions:
    - create_access_token(user_id=123)  # Simple
    - create_access_token(data={"sub": "123"}, expires_delta=timedelta(hours=1))  # Full control

    Args:
        data: Dictionary with claims (must contain "sub" key)
        user_id: User ID (alternative to data)
        expires_delta: Custom expiration time

    Returns:
        Encoded JWT token string
    """
    if data is not None:
        to_encode = data.copy()
    elif user_id is not None:
        to_encode = {"sub": str(user_id)}
    else:
        raise ValueError("Either 'data' or 'user_id' must be provided")

    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    data: Optional[Dict[str, Any]] = None,
    user_id: Optional[int] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT refresh token.

    Supports two calling conventions:
    - create_refresh_token(user_id=123)  # Simple
    - create_refresh_token(data={"sub": "123"})  # Full control
    """
    if data is not None:
        to_encode = data.copy()
    elif user_id is not None:
        to_encode = {"sub": str(user_id)}
    else:
        raise ValueError("Either 'data' or 'user_id' must be provided")

    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_tokens(user_id: int) -> Tuple[str, str]:
    """Create both access and refresh tokens."""
    return (
        create_access_token(user_id=user_id),
        create_refresh_token(user_id=user_id)
    )


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def get_user_id_from_token(token: str) -> Optional[int]:
    """Extract user ID from token."""
    payload = decode_token(token)
    if payload is None:
        return None

    sub = payload.get("sub")
    if sub is None:
        return None

    try:
        return int(sub)
    except (ValueError, TypeError):
        return None