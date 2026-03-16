"""Critical API regression tests for study planner core modules."""

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values


def _resolve_base_url() -> str:
    # module: environment/base URL resolution
    env_url = os.environ.get("REACT_APP_BACKEND_URL")
    if env_url:
        return env_url.rstrip("/")

    frontend_env = Path("/app/frontend/.env")
    env_vals = dotenv_values(frontend_env)
    loaded_url = env_vals.get("REACT_APP_BACKEND_URL")
    if loaded_url:
        return loaded_url.rstrip("/")

    raise RuntimeError("REACT_APP_BACKEND_URL is not configured")


BASE_URL = _resolve_base_url()
API_BASE = f"{BASE_URL}/api"


@pytest.fixture
def api_client():
    # module: shared API session
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def cleanup_ids(api_client):
    # module: cleanup for created task/deadline entities
    created = {"tasks": [], "deadlines": []}
    yield created
    for task_id in created["tasks"]:
        api_client.delete(f"{API_BASE}/tasks/{task_id}")
    for deadline_id in created["deadlines"]:
        api_client.delete(f"{API_BASE}/deadlines/{deadline_id}")


def _get_analytics(api_client):
    response = api_client.get(f"{API_BASE}/analytics/summary", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("tasks_total"), int)
    assert isinstance(data.get("focus_minutes_total"), int)
    return data


def test_api_root_health(api_client):
    # module: health endpoint
    response = api_client.get(f"{API_BASE}/", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "AI Study Planner API is running"


def test_generate_plan(api_client):
    # module: AI plan generation endpoint
    payload = {
        "goals": "TEST_linear algebra revision, TEST_probability practice",
        "available_hours_per_day": 2,
        "study_days": 3,
        "priorities": "weak topics first",
    }
    response = api_client.post(f"{API_BASE}/plans/generate", json=payload, timeout=90)
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data.get("id"), str) and data["id"]
    assert data["goals"] == payload["goals"]
    assert data["study_days"] == payload["study_days"]
    assert isinstance(data.get("summary"), str)
    assert isinstance(data.get("generated_schedule"), list)
    assert len(data["generated_schedule"]) == payload["study_days"]
    assert isinstance(data["generated_schedule"][0]["topics"], list)


def test_task_crud_and_analytics_reflection(api_client, cleanup_ids):
    # module: task CRUD and analytics reflection
    before = _get_analytics(api_client)

    marker = f"TEST_task_{uuid.uuid4().hex[:8]}"
    create_payload = {
        "title": marker,
        "subject": "TEST_Subject",
        "priority": "high",
        "due_date": datetime.now(timezone.utc).isoformat(),
        "estimated_minutes": 30,
        "completed": False,
    }
    create_res = api_client.post(f"{API_BASE}/tasks", json=create_payload, timeout=30)
    assert create_res.status_code == 200
    created = create_res.json()
    cleanup_ids["tasks"].append(created["id"])

    assert created["title"] == create_payload["title"]
    assert created["completed"] is False
    assert created["priority"] == "high"

    list_res = api_client.get(f"{API_BASE}/tasks", timeout=30)
    assert list_res.status_code == 200
    tasks = list_res.json()
    matched = [task for task in tasks if task["id"] == created["id"]]
    assert len(matched) == 1
    assert matched[0]["title"] == marker

    update_res = api_client.put(f"{API_BASE}/tasks/{created['id']}", json={"completed": True}, timeout=30)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["completed"] is True

    after_update = _get_analytics(api_client)
    assert after_update["tasks_total"] >= before["tasks_total"] + 1
    assert after_update["tasks_completed"] >= before["tasks_completed"] + 1

    delete_res = api_client.delete(f"{API_BASE}/tasks/{created['id']}", timeout=30)
    assert delete_res.status_code == 200
    cleanup_ids["tasks"].remove(created["id"])
    delete_data = delete_res.json()
    assert delete_data["success"] is True

    list_after_delete = api_client.get(f"{API_BASE}/tasks", timeout=30)
    assert list_after_delete.status_code == 200
    ids_after_delete = [task["id"] for task in list_after_delete.json()]
    assert created["id"] not in ids_after_delete


def test_deadline_crud_and_reminders(api_client, cleanup_ids):
    # module: deadline CRUD and reminders endpoint behavior
    marker = f"TEST_deadline_{uuid.uuid4().hex[:8]}"
    due_now = datetime.now(timezone.utc).isoformat()

    create_payload = {
        "title": marker,
        "subject": "TEST_Subject",
        "due_date": due_now,
        "reminder_date": due_now,
        "notes": "TEST notes",
        "completed": False,
    }

    create_res = api_client.post(f"{API_BASE}/deadlines", json=create_payload, timeout=30)
    assert create_res.status_code == 200
    created = create_res.json()
    cleanup_ids["deadlines"].append(created["id"])

    assert created["title"] == marker
    assert created["completed"] is False

    reminders_res = api_client.get(f"{API_BASE}/reminders", timeout=30)
    assert reminders_res.status_code == 200
    reminders = reminders_res.json()
    target = [item for item in reminders if item["id"] == created["id"]]
    assert len(target) == 1
    assert target[0]["urgency"] in ["due_soon", "overdue"]

    update_res = api_client.put(f"{API_BASE}/deadlines/{created['id']}", json={"completed": True}, timeout=30)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["completed"] is True

    reminders_after = api_client.get(f"{API_BASE}/reminders", timeout=30)
    assert reminders_after.status_code == 200
    ids_after = [item["id"] for item in reminders_after.json()]
    assert created["id"] not in ids_after

    delete_res = api_client.delete(f"{API_BASE}/deadlines/{created['id']}", timeout=30)
    assert delete_res.status_code == 200
    cleanup_ids["deadlines"].remove(created["id"])
    assert delete_res.json()["success"] is True


def test_focus_session_logging_and_analytics(api_client):
    # module: focus-session logging and analytics update
    before = _get_analytics(api_client)
    marker_start = datetime.now(timezone.utc).isoformat()

    create_payload = {
        "duration_minutes": 7,
        "started_at": marker_start,
        "completed": True,
    }
    create_res = api_client.post(f"{API_BASE}/focus-sessions", json=create_payload, timeout=30)
    assert create_res.status_code == 200
    created = create_res.json()

    assert created["duration_minutes"] == 7
    assert created["completed"] is True
    assert isinstance(created["id"], str)

    sessions_res = api_client.get(f"{API_BASE}/focus-sessions", timeout=30)
    assert sessions_res.status_code == 200
    sessions = sessions_res.json()
    target = [item for item in sessions if item["id"] == created["id"]]
    assert len(target) == 1

    after = _get_analytics(api_client)
    assert after["focus_sessions_count"] >= before["focus_sessions_count"] + 1
    assert after["focus_minutes_total"] >= before["focus_minutes_total"] + 7
