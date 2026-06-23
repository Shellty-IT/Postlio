import logging
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class NotFoundError(Exception):
    def __init__(self, resource: str = "Resource"):
        self.resource = resource
        super().__init__(f"{resource} not found")


class ForbiddenError(Exception):
    def __init__(self, detail: str = "Access denied"):
        super().__init__(detail)


class ConflictError(Exception):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(detail)


class BadRequestError(Exception):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(detail)


def register_exception_handlers(app) -> None:
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError):
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(ForbiddenError)
    async def forbidden_handler(request: Request, exc: ForbiddenError):
        return JSONResponse(status_code=403, content={"detail": str(exc)})

    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError):
        return JSONResponse(status_code=409, content={"detail": str(exc)})

    @app.exception_handler(BadRequestError)
    async def bad_request_handler(request: Request, exc: BadRequestError):
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
