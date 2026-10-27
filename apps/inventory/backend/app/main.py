"""FastAPI application entry point."""

import logging
import sys

from fastapi import FastAPI, Request

from app import repository, router, service


def configure_logging() -> None:
    """Configures application logs for terminal output."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        stream=sys.stdout,
    )


def create_app() -> FastAPI:
    """Creates an isolated FastAPI application instance."""
    configure_logging()
    application = FastAPI(
        title="Inventory Todo API",
        version="0.1.0",
    )
    application.state.todo_service = service.TodoService(
        repository.TodoRepository(),
    )
    application.include_router(router.router)

    @application.middleware("http")
    async def log_request(request: Request, call_next):
        response = await call_next(request)
        logging.getLogger("inventory.http").info(
            "request method=%s path=%s status=%s",
            request.method,
            request.url.path,
            response.status_code,
        )
        return response

    @application.get("/api/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
