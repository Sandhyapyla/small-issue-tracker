# Small Issue Tracker - Backend (FastAPI)

## Requirements
- Python 3.10+

## Setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

## Run

```bash
# inside backend folder with venv activated
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:
```bash
curl http://127.0.0.1:8000/health
```

## Datastore
- JSON file persisted at `backend/data/issues.json`
- Auto-created with sample issues if missing

## API
- GET `/health` → `{ "status": "ok" }`
- GET `/issues` → query params:
  - `search` (string, in title)
  - `status` in [open, in_progress, resolved, closed]
  - `priority` in [low, medium, high, critical]
  - `assignee` (string)
  - `sortBy` in [id, title, status, priority, assignee, updatedAt] (default: updatedAt)
  - `sortDir` in [asc, desc] (default: desc)
  - `page` (int, default 1)
  - `pageSize` (int, default 10)
  - Response: `{ items, total, page, pageSize }`
- GET `/issues/{id}` → single issue
- POST `/issues` → create issue (server sets `id`, `createdAt`, `updatedAt`)
- PUT `/issues/{id}` → update issue (server refreshes `updatedAt`)

CORS is enabled for all origins to allow local frontend dev.
