# Small Issue Tracker

A simple Issue Tracker with a Python FastAPI backend and an Angular frontend.

## Prerequisites
- Python 3.10+
- Node.js 18+ (Angular CLI 16 project)
- npm 8+

## Backend (FastAPI)

1) Setup
```
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

2) Run
```
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

3) Test
```
curl http://127.0.0.1:8000/health
```

APIs:
- GET /health
- GET /issues (search, filters, sort, pagination)
- GET /issues/:id
- POST /issues
- PUT /issues/:id

## Frontend (Angular)

The project uses Angular CLI 16 to avoid esbuild/vite issues on some Windows/Node combos.

1) Install
```
cd frontend
npm install
```

2) Run dev server
```
npx ng serve --host 127.0.0.1 --port 4200
```
Visit `http://127.0.0.1:4200`.

The UI includes:
- Issues List with search, filters (status, priority, assignee), sort, pagination
- Create Issue form
- Edit Issue via Issue Detail (use Edit link or button)
- Issue Detail view displays raw JSON

## Packaging
- Zip: compress the entire `small-issue-tracker` directory excluding `backend/.venv` and `frontend/node_modules` to keep size small.
- GitHub: initialize a repo and push this folder.

```
# optional (from project root)
git init
git add .
git commit -m "Small Issue Tracker"
```
