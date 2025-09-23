from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, TypedDict

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# -----------------------------
# Models
# -----------------------------

Status = Literal["open", "in_progress", "resolved", "closed"]
Priority = Literal["low", "medium", "high", "critical"]


class IssueCreate(BaseModel):
	title: str = Field(min_length=1)
	description: Optional[str] = None
	status: Status = "open"
	priority: Priority = "medium"
	assignee: Optional[str] = None


class IssueUpdate(BaseModel):
	title: Optional[str] = None
	description: Optional[str] = None
	status: Optional[Status] = None
	priority: Optional[Priority] = None
	assignee: Optional[str] = None


class Issue(BaseModel):
	id: int
	title: str
	description: Optional[str] = None
	status: Status
	priority: Priority
	assignee: Optional[str] = None
	createdAt: str
	updatedAt: str


# -----------------------------
# Datastore (JSON file)
# -----------------------------

class _StoreState(TypedDict):
	next_id: int
	issues: List[Dict[str, Any]]


class IssueStore:
	def __init__(self, data_dir: Path):
		self.data_dir = data_dir
		self.file_path = self.data_dir / "issues.json"
		self._lock = threading.RLock()
		self.data_dir.mkdir(parents=True, exist_ok=True)
		if not self.file_path.exists():
			self._init_file()

	def _init_file(self) -> None:
		now = self._now()
		initial: _StoreState = {
			"next_id": 3,
			"issues": [
				{
					"id": 1,
					"title": "Sample bug: Login button misaligned",
					"description": "On mobile Safari, login button overlaps footer.",
					"status": "open",
					"priority": "medium",
					"assignee": "Alice",
					"createdAt": now,
					"updatedAt": now,
				},
				{
					"id": 2,
					"title": "Feature: Add export to CSV",
					"description": "Allow exporting issues to CSV from list page.",
					"status": "in_progress",
					"priority": "high",
					"assignee": "Bob",
					"createdAt": now,
					"updatedAt": now,
				},
			],
		}
		self._write(initial)

	def _read(self) -> _StoreState:
		with self._lock:
			with self.file_path.open("r", encoding="utf-8") as f:
				return json.load(f)

	def _write(self, state: _StoreState) -> None:
		with self._lock:
			tmp_path = self.file_path.with_suffix(".tmp")
			with tmp_path.open("w", encoding="utf-8") as f:
				json.dump(state, f, ensure_ascii=False, indent=2)
			os.replace(tmp_path, self.file_path)

	def _now(self) -> str:
		return datetime.now(timezone.utc).isoformat()

	# CRUD operations
	def list_issues(self) -> List[Dict[str, Any]]:
		state = self._read()
		return list(state["issues"])  # copy

	def get_issue(self, issue_id: int) -> Optional[Dict[str, Any]]:
		state = self._read()
		for issue in state["issues"]:
			if issue["id"] == issue_id:
				return dict(issue)
		return None

	def create_issue(self, payload: IssueCreate) -> Dict[str, Any]:
		state = self._read()
		new_id = state["next_id"]
		now = self._now()
		issue: Dict[str, Any] = {
			"id": new_id,
			"title": payload.title,
			"description": payload.description,
			"status": payload.status,
			"priority": payload.priority,
			"assignee": payload.assignee,
			"createdAt": now,
			"updatedAt": now,
		}
		state["issues"].append(issue)
		state["next_id"] = new_id + 1
		self._write(state)
		return issue

	def update_issue(self, issue_id: int, payload: IssueUpdate) -> Optional[Dict[str, Any]]:
		state = self._read()
		updated: Optional[Dict[str, Any]] = None
		for idx, issue in enumerate(state["issues"]):
			if issue["id"] == issue_id:
				# apply updates
				data = dict(issue)
				if payload.title is not None:
					data["title"] = payload.title
				if payload.description is not None:
					data["description"] = payload.description
				if payload.status is not None:
					data["status"] = payload.status
				if payload.priority is not None:
					data["priority"] = payload.priority
				if payload.assignee is not None:
					data["assignee"] = payload.assignee
				data["updatedAt"] = self._now()
				state["issues"][idx] = data
				updated = data
				break
		if updated is not None:
			self._write(state)
		return updated


# -----------------------------
# API
# -----------------------------

app = FastAPI(title="Small Issue Tracker API", version="1.0.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
store = IssueStore(DATA_DIR)


@app.get("/health")
def health() -> Dict[str, str]:
	return {"status": "ok"}


class IssuesResponse(BaseModel):
	items: List[Issue]
	total: int
	page: int
	pageSize: int


@app.get("/issues", response_model=IssuesResponse)
def list_issues(
	search: Optional[str] = Query(None, description="Search by title"),
	status: Optional[Status] = Query(None),
	priority: Optional[Priority] = Query(None),
	assignee: Optional[str] = Query(None),
	sortBy: Optional[Literal["id", "title", "status", "priority", "assignee", "updatedAt"]] = Query(
		"updatedAt"
	),
	sortDir: Optional[Literal["asc", "desc"]] = Query("desc"),
	page: int = Query(1, ge=1),
	pageSize: int = Query(10, ge=1, le=100),
) -> Any:
	issues = store.list_issues()

	# filtering
	def matches(issue: Dict[str, Any]) -> bool:
		if search:
			if search.lower() not in issue.get("title", "").lower():
				return False
		if status and issue.get("status") != status:
			return False
		if priority and issue.get("priority") != priority:
			return False
		if assignee and (issue.get("assignee") or "") != assignee:
			return False
		return True

	filtered = [i for i in issues if matches(i)]

	# sorting
	reverse = (sortDir or "desc").lower() == "desc"
	key_name = sortBy or "updatedAt"

	def sort_key(issue: Dict[str, Any]):
		value = issue.get(key_name)
		# normalize datetime strings for comparison
		if key_name in {"createdAt", "updatedAt"} and isinstance(value, str):
			return value
		return value

	filtered.sort(key=sort_key, reverse=reverse)

	# pagination
	total = len(filtered)
	start = (page - 1) * pageSize
	end = start + pageSize
	page_items = filtered[start:end]

	# model conversion
	items = [Issue(**i) for i in page_items]
	return {"items": items, "total": total, "page": page, "pageSize": pageSize}


@app.get("/issues/{issue_id}", response_model=Issue)
def get_issue(issue_id: int) -> Any:
	issue = store.get_issue(issue_id)
	if issue is None:
		raise HTTPException(status_code=404, detail="Issue not found")
	return Issue(**issue)


@app.post("/issues", response_model=Issue, status_code=201)
def create_issue(payload: IssueCreate) -> Any:
	created = store.create_issue(payload)
	return Issue(**created)


@app.put("/issues/{issue_id}", response_model=Issue)
def update_issue(issue_id: int, payload: IssueUpdate) -> Any:
	updated = store.update_issue(issue_id, payload)
	if updated is None:
		raise HTTPException(status_code=404, detail="Issue not found")
	return Issue(**updated)


# Convenience: uvicorn entry
if __name__ == "__main__":
	import uvicorn

	uvicorn.run(
		"app.main:app",
		host="0.0.0.0",
		port=int(os.getenv("PORT", "8000")),
		reload=True,
	)
