# app/services/link_preview_service.py
"""
Pobiera metadane Open Graph dla URL wklejonego w edytorze (podgląd linku).

Fetch idzie z serwera na adres podany przez użytkownika, więc to wprost
kandydat na SSRF - ograniczamy schemat do http/https, sprawdzamy rozwiązany
adres IP przeciwko zakresom prywatnym/link-local (w tym metadata endpoint
chmury 169.254.169.254), nie podążamy za przekierowaniami, i ograniczamy
rozmiar odpowiedzi oraz czas oczekiwania. Wyniki cache'owane w pamięci
procesu (TTL), żeby nie odpytywać tej samej domeny przy każdym wklejeniu.

Znane ograniczenie: sprawdzamy adres IP raz przed połączeniem (DNS
rebinding może w teorii ominąć tę kontrolę) - akceptowalne dla obecnej
skali, do rewizji jeśli endpoint kiedyś obsłuży wrażliwsze środowisko.
"""
import ipaddress
import logging
import socket
import time
from html.parser import HTMLParser
from typing import Dict, Optional
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)

MAX_RESPONSE_BYTES = 2 * 1024 * 1024
FETCH_TIMEOUT_SECONDS = 5.0
CACHE_TTL_SECONDS = 24 * 60 * 60
_CACHE_MAX_ENTRIES = 500

_cache: Dict[str, tuple] = {}


class LinkPreviewError(Exception):
    """Błąd walidacji URL albo pobierania podglądu - bezpieczny do pokazania użytkownikowi."""


def _validate_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise LinkPreviewError("Tylko adresy http/https są wspierane")
    if not parsed.hostname:
        raise LinkPreviewError("Nieprawidłowy adres URL")
    return parsed.hostname


def _assert_public_host(hostname: str) -> None:
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise LinkPreviewError("Nie można rozwiązać adresu")

    if not infos:
        raise LinkPreviewError("Nie można rozwiązać adresu")

    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private or ip.is_loopback or ip.is_link_local
            or ip.is_multicast or ip.is_reserved or ip.is_unspecified
        ):
            raise LinkPreviewError("Ten adres wskazuje na sieć wewnętrzną i jest zablokowany")


class _OpenGraphParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.og: Dict[str, str] = {}
        self.title: Optional[str] = None
        self._in_title = False

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "meta":
            attrs_dict = dict(attrs)
            prop = attrs_dict.get("property") or attrs_dict.get("name") or ""
            content = attrs_dict.get("content")
            if content and prop.startswith("og:"):
                self.og[prop[3:]] = content
        elif tag == "title":
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title and not self.title:
            self.title = data.strip()


def _cache_get(url: str) -> Optional[dict]:
    entry = _cache.get(url)
    if entry and entry[0] > time.monotonic():
        return entry[1]
    return None


def _cache_set(url: str, result: dict) -> None:
    if len(_cache) >= _CACHE_MAX_ENTRIES:
        _cache.clear()
    _cache[url] = (time.monotonic() + CACHE_TTL_SECONDS, result)


async def fetch_link_preview(url: str) -> Dict[str, Optional[str]]:
    cached = _cache_get(url)
    if cached is not None:
        return cached

    hostname = _validate_url(url)
    _assert_public_host(hostname)

    try:
        async with httpx.AsyncClient(follow_redirects=False, timeout=FETCH_TIMEOUT_SECONDS) as client:
            async with client.stream(
                "GET", url, headers={"User-Agent": "PostlioLinkPreview/1.0"}
            ) as response:
                if response.status_code >= 300:
                    raise LinkPreviewError(f"Serwer odpowiedział kodem {response.status_code}")

                content_type = response.headers.get("content-type", "")
                if "text/html" not in content_type:
                    raise LinkPreviewError("Ten adres nie wskazuje na stronę HTML")

                body = b""
                async for chunk in response.aiter_bytes():
                    body += chunk
                    if len(body) > MAX_RESPONSE_BYTES:
                        raise LinkPreviewError("Strona jest za duża do podglądu")

                encoding = response.encoding or "utf-8"
    except httpx.HTTPError as e:
        logger.warning("Link preview fetch failed for %s: %s", url, e)
        raise LinkPreviewError("Nie udało się pobrać strony")

    html = body.decode(encoding, errors="ignore")
    parser = _OpenGraphParser()
    parser.feed(html)

    result = {
        "url": url,
        "title": parser.og.get("title") or parser.title,
        "description": parser.og.get("description"),
        "image": parser.og.get("image"),
        "site_name": parser.og.get("site_name"),
    }

    _cache_set(url, result)
    return result
