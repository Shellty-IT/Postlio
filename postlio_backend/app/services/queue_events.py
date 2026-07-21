# app/services/queue_events.py
"""
In-process pub/sub dla zmian statusu elementow kolejki Autopilota.

Pozwala dashboardowi subskrybowac zdarzenia przez SSE zamiast odpytywac
API co kilka sekund - status "pending -> approved -> published" (w tym
ten ustawiany w tle przez scheduler, bez udzialu uzytkownika) pojawia sie
na ekranie natychmiast.

Uwaga: dziala tylko w ramach jednego procesu (asyncio.Queue w pamieci).
Jesli aplikacja kiedys przejdzie na wiele workerow/instancji, to trzeba
zastapic Redis pub/sub albo analogicznym mechanizmem miedzyprocesowym.
"""
import asyncio
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

_subscribers: Dict[int, set] = {}


def subscribe(config_id: int) -> "asyncio.Queue[Dict[str, Any]]":
    """Zarejestruj nowego subskrybenta dla danej konfiguracji Autopilota."""
    queue: "asyncio.Queue[Dict[str, Any]]" = asyncio.Queue()
    _subscribers.setdefault(config_id, set()).add(queue)
    return queue


def unsubscribe(config_id: int, queue: "asyncio.Queue[Dict[str, Any]]") -> None:
    subs = _subscribers.get(config_id)
    if not subs:
        return
    subs.discard(queue)
    if not subs:
        _subscribers.pop(config_id, None)


def publish(config_id: int, event: Dict[str, Any]) -> None:
    """Wyślij zdarzenie do wszystkich subskrybentów danej konfiguracji (no-op jeśli nikt nie słucha)."""
    subs = _subscribers.get(config_id)
    if not subs:
        return
    for queue in subs:
        try:
            queue.put_nowait(event)
        except Exception:
            logger.warning("Failed to enqueue queue event for config %s", config_id)
