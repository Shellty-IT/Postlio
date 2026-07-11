# postlio_backend/app/services/social/encryption.py
"""
Szyfrowanie tokenów OAuth w bazie danych.
Używa Fernet (symetryczne szyfrowanie AES-128-CBC).
"""

import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.config import settings, TESTING
import logging

logger = logging.getLogger(__name__)


class TokenEncryption:
    """
    Szyfrowanie i deszyfrowanie tokenów OAuth.

    Tokeny są wrażliwe dane - przechowujemy je zaszyfrowane w bazie.
    Klucz szyfrowania jest w zmiennych środowiskowych.
    """

    _instance: Optional["TokenEncryption"] = None
    _fernet: Optional[Fernet] = None

    def __new__(cls) -> "TokenEncryption":
        """Singleton pattern - jedna instancja dla całej aplikacji."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        """Inicjalizacja Fernet z kluczem."""
        if settings.TOKEN_ENCRYPTION_KEY:
            try:
                # Klucz powinien być już w formacie base64 (z Fernet.generate_key())
                self._fernet = Fernet(settings.TOKEN_ENCRYPTION_KEY.encode())
                logger.info("Token encryption initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize token encryption: {e}")
                self._fernet = None
        elif settings.DEBUG or TESTING:
            # Fallback: generuj klucz z SECRET_KEY (mniej bezpieczne, tylko dev/testy)
            logger.warning(
                "TOKEN_ENCRYPTION_KEY not set! Using derived key from SECRET_KEY. "
                "Set TOKEN_ENCRYPTION_KEY in production!"
            )
            # Generuj klucz 32-bajtowy z SECRET_KEY
            key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
            self._fernet = Fernet(base64.urlsafe_b64encode(key))
        else:
            # config.py blokuje start w tej sytuacji; ten branch to dodatkowa
            # bariera na wypadek, gdyby Settings zostały skonstruowane inaczej.
            raise RuntimeError(
                "TOKEN_ENCRYPTION_KEY must be set when DEBUG=false. "
                "Refusing to derive an encryption key from SECRET_KEY in production."
            )

    def encrypt(self, plaintext: str) -> str:
        """
        Szyfruje tekst (token).

        Args:
            plaintext: Token do zaszyfrowania

        Returns:
            Zaszyfrowany token (base64)
        """
        if not self._fernet:
            raise RuntimeError("Token encryption not initialized")

        if not plaintext:
            return ""

        try:
            encrypted = self._fernet.encrypt(plaintext.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt(self, ciphertext: str) -> str:
        """
        Deszyfruje token.

        Args:
            ciphertext: Zaszyfrowany token

        Returns:
            Odszyfrowany token
        """
        if not self._fernet:
            raise RuntimeError("Token encryption not initialized")

        if not ciphertext:
            return ""

        try:
            decrypted = self._fernet.decrypt(ciphertext.encode())
            return decrypted.decode()
        except InvalidToken:
            logger.error("Invalid token - decryption failed (wrong key or corrupted data)")
            raise ValueError("Cannot decrypt token - invalid encryption key or corrupted data")
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise

    def is_initialized(self) -> bool:
        """Sprawdza czy szyfrowanie jest zainicjalizowane."""
        return self._fernet is not None


# Globalna instancja
token_encryption = TokenEncryption()