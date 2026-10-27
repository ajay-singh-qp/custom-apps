# Inventory FastAPI backend

This service provides an in-memory todo CRUD API. Data lasts only for the life
of the process and is reset whenever the server restarts.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --reload --port 8000
```

API documentation is available at `http://localhost:8000/docs`.

## Endpoints

- `GET /api/health`
- `GET /api/todos`
- `GET /api/todos/{todo_id}`
- `POST /api/todos`
- `PATCH /api/todos/{todo_id}`
- `DELETE /api/todos/{todo_id}`

Run checks with:

```bash
pytest
ruff check .
ruff format --check .
```
