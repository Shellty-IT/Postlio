# app/utils/request_context.py
"""
Request ID: koreluje logi, odpowiedzi API i zdarzenia Sentry dla jednego requesta.

Middleware ustawia go w kontekście (i w nagłówku odpowiedzi X-Request-ID),
a RequestIdLogFilter wstrzykuje go do każdego rekordu logu powstałego
w trakcie obsługi tego requesta - bez przekazywania go ręcznie przez warstwy.
"""
import logging
import uuid
from contextvars import ContextVar

import sentry_sdk
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

REQUEST_ID_HEADER = "X-Request-ID"

_request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


def get_request_id() -> str:
    return _request_id_var.get()


class RequestIdLogFilter(logging.Filter):
    """Dodaje pole `request_id` do każdego LogRecord, do użycia w formatterze."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _request_id_var.get()
        return True


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Przyjmuje X-Request-ID od klienta/proxy albo generuje nowy per request."""

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        incoming = request.headers.get(REQUEST_ID_HEADER)
        request_id = incoming or uuid.uuid4().hex
        token = _request_id_var.set(request_id)
        sentry_sdk.set_tag("request_id", request_id)

        try:
            response = await call_next(request)
        finally:
            _request_id_var.reset(token)

        response.headers[REQUEST_ID_HEADER] = request_id
        return response
