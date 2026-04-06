import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Literal, Optional

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_iso_date(date_value: Optional[str]) -> Optional[datetime]:
    if not date_value:
        return None
    try:
        return datetime.fromisoformat(date_value.replace("Z", "+00:00"))
    except ValueError:
        return None


def strip_json_fence(text: str) -> str:
    matches = re.findall(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL)
    if matches:
        return matches[0].strip()
    return text.strip()


class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class TaskBase(BaseModel):
    title: str
    subject: str = "General"
    priority: Literal["low", "medium", "high"] = "medium"
    due_date: Optional[str] = None
    estimated_minutes: int = 60
    completed: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    priority: Optional[Literal["low", "medium", "high"]] = None
    due_date: Optional[str] = None
    estimated_minutes: Optional[int] = None
    completed: Optional[bool] = None


class Task(TaskBase):
    id: str
    created_at: str
    updated_at: str


class DeadlineBase(BaseModel):
    title: str
    subject: str = "General"
    due_date: str
    reminder_date: Optional[str] = None
    notes: Optional[str] = ""
    completed: bool = False


class DeadlineCreate(DeadlineBase):
    pass


class DeadlineUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[str] = None
    reminder_date: Optional[str] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None


class Deadline(DeadlineBase):
    id: str
    created_at: str
    updated_at: str


class FocusSessionCreate(BaseModel):
    duration_minutes: int
    started_at: Optional[str] = None
    completed: bool = True


class FocusSession(BaseModel):
    id: str
    duration_minutes: int
    started_at: str
    completed: bool
    created_at: str


class StudyPlanRequest(BaseModel):
    goals: str
    available_hours_per_day: float
    study_days: int = 7
    priorities: Optional[str] = ""


class StudyDay(BaseModel):
    day: str
    topics: List[str]
    focus_minutes: int
    notes: str


class StudyPlanResponse(BaseModel):
    id: str
    goals: str
    priorities: str
    available_hours_per_day: float
    study_days: int
    generated_schedule: List[StudyDay]
    summary: str
    raw_text: str
    created_at: str


class ReminderItem(BaseModel):
    id: str
    title: str
    due_date: str
    days_left: int
    urgency: Literal["overdue", "due_soon", "upcoming"]


class SubjectStat(BaseModel):
    subject: str
    total_tasks: int
    completed_tasks: int


class AnalyticsSummary(BaseModel):
    tasks_total: int
    tasks_completed: int
    deadlines_upcoming: int
    focus_minutes_total: int
    focus_sessions_count: int
    productivity_score: int
    subject_breakdown: List[SubjectStat] = Field(default_factory=list)


def fallback_schedule(payload: StudyPlanRequest) -> tuple[List[Dict], str]:
    topics = [part.strip() for part in re.split(r",|;", payload.goals) if part.strip()]
    if not topics:
        topics = ["General Revision"]

    plan: List[Dict] = []
    for day_index in range(payload.study_days):
        topic = topics[day_index % len(topics)]
        plan.append(
            {
                "day": f"Day {day_index + 1}",
                "topics": [topic, "Active recall"],
                "focus_minutes": int(payload.available_hours_per_day * 60),
                "notes": "Study in two focused blocks with a short revision at the end.",
            }
        )

    return plan, "Structured fallback plan generated."


def extract_schedule_source_and_summary(loaded: object) -> tuple[List[Dict], str]:
    if isinstance(loaded, dict):
        summary = loaded["summary"] if isinstance(loaded.get("summary"), str) else "AI generated plan created."
        schedule = loaded["schedule"] if isinstance(loaded.get("schedule"), list) else []
        return schedule, summary

    if isinstance(loaded, list):
        return loaded, "AI generated plan created."

    return [], "AI generated plan created."


def normalize_topics(topics: object) -> List[str]:
    if isinstance(topics, str):
        return [topics]
    if isinstance(topics, list) and topics:
        return [str(topic) for topic in topics]
    return ["General topic"]


def normalize_schedule_entries(schedule_source: List[Dict], payload: StudyPlanRequest) -> List[Dict]:
    normalized_schedule: List[Dict] = []
    default_focus_minutes = int(payload.available_hours_per_day * 60)

    for idx, item in enumerate(schedule_source[: payload.study_days]):
        if not isinstance(item, dict):
            continue

        normalized_schedule.append(
            {
                "day": str(item.get("day", f"Day {idx + 1}")),
                "topics": normalize_topics(item.get("topics")),
                "focus_minutes": int(item.get("focus_minutes", default_focus_minutes)),
                "notes": str(item.get("notes", "Review and recap for 10 minutes.")),
            }
        )

    return normalized_schedule


def pad_schedule_days(normalized_schedule: List[Dict], payload: StudyPlanRequest) -> List[Dict]:
    while len(normalized_schedule) < payload.study_days:
        next_day = len(normalized_schedule) + 1
        normalized_schedule.append(
            {
                "day": f"Day {next_day}",
                "topics": ["Revision Block"],
                "focus_minutes": int(payload.available_hours_per_day * 60),
                "notes": "Use this day for weak-topic reinforcement.",
            }
        )
    return normalized_schedule


def parse_plan_response(raw_text: str, payload: StudyPlanRequest) -> tuple[List[Dict], str]:
    cleaned = strip_json_fence(raw_text)
    try:
        loaded = json.loads(cleaned)
    except json.JSONDecodeError:
        return fallback_schedule(payload)

    schedule_source, summary = extract_schedule_source_and_summary(loaded)
    normalized_schedule = normalize_schedule_entries(schedule_source, payload)

    if not normalized_schedule:
        return fallback_schedule(payload)

    return pad_schedule_days(normalized_schedule, payload), summary


def count_upcoming_deadlines(deadlines: List[Dict], now: datetime) -> int:
    return sum(
        1
        for deadline in deadlines
        if (due_date := parse_iso_date(deadline.get("due_date"))) and due_date >= now
    )


def build_subject_breakdown(tasks: List[Dict]) -> List[SubjectStat]:
    subject_map: Dict[str, Dict[str, int]] = {}
    for task in tasks:
        subject = task.get("subject", "General")
        if subject not in subject_map:
            subject_map[subject] = {"total": 0, "completed": 0}
        subject_map[subject]["total"] += 1
        if task.get("completed"):
            subject_map[subject]["completed"] += 1

    subject_breakdown = [
        SubjectStat(subject=subject, total_tasks=stats["total"], completed_tasks=stats["completed"])
        for subject, stats in subject_map.items()
    ]
    subject_breakdown.sort(key=lambda item: item.total_tasks, reverse=True)
    return subject_breakdown


def calculate_productivity_score(tasks_total: int, tasks_completed: int, focus_minutes_total: int) -> int:
    completion_ratio = tasks_completed / tasks_total if tasks_total else 0
    focus_component = min(50, focus_minutes_total // 10)
    return min(100, int(completion_ratio * 50 + focus_component))


@api_router.get("/")
async def root():
    return {"message": "AI Study Planner API is running"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check.get("timestamp"), str):
            check["timestamp"] = datetime.fromisoformat(check["timestamp"])
    return status_checks


@api_router.post("/plans/generate", response_model=StudyPlanResponse)
async def generate_study_plan(payload: StudyPlanRequest):
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        raise HTTPException(status_code=500, detail="Missing EMERGENT_LLM_KEY in backend environment")

    prompt = (
        "Create a realistic student study plan. Return only JSON with keys: "
        "summary and schedule. schedule must be an array of objects with day, topics, focus_minutes, notes. "
        f"Goals: {payload.goals}. Priorities: {payload.priorities}. "
        f"Hours per day: {payload.available_hours_per_day}. Number of days: {payload.study_days}."
    )

    chat = LlmChat(
        api_key=llm_key,
        session_id=f"study-plan-{uuid.uuid4()}",
        system_message="You are a study productivity assistant. Output strict JSON only.",
    ).with_model("openai", "gpt-5.2")

    ai_response = await chat.send_message(UserMessage(text=prompt))
    raw_text = ai_response if isinstance(ai_response, str) else str(ai_response)

    generated_schedule, summary = parse_plan_response(raw_text, payload)

    plan_doc = {
        "id": str(uuid.uuid4()),
        "goals": payload.goals,
        "priorities": payload.priorities or "",
        "available_hours_per_day": payload.available_hours_per_day,
        "study_days": payload.study_days,
        "generated_schedule": generated_schedule,
        "summary": summary,
        "raw_text": raw_text,
        "created_at": now_iso(),
    }

    await db.study_plans.insert_one(plan_doc.copy())
    return StudyPlanResponse(**plan_doc)


@api_router.get("/plans", response_model=List[StudyPlanResponse])
async def get_study_plans():
    plans = await db.study_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return plans


@api_router.post("/tasks", response_model=Task)
async def create_task(payload: TaskCreate):
    timestamp = now_iso()
    task_doc = payload.model_dump()
    task_doc.update({"id": str(uuid.uuid4()), "created_at": timestamp, "updated_at": timestamp})
    await db.tasks.insert_one(task_doc.copy())
    return Task(**task_doc)


@api_router.get("/tasks", response_model=List[Task])
async def get_tasks():
    tasks = await db.tasks.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return tasks


@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: TaskUpdate):
    updates = {key: value for key, value in payload.model_dump().items() if value is not None}
    updates["updated_at"] = now_iso()
    result = await db.tasks.update_one({"id": task_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    updated_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated_task


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "message": "Task deleted"}


@api_router.post("/deadlines", response_model=Deadline)
async def create_deadline(payload: DeadlineCreate):
    timestamp = now_iso()
    deadline_doc = payload.model_dump()
    deadline_doc.update({"id": str(uuid.uuid4()), "created_at": timestamp, "updated_at": timestamp})
    await db.deadlines.insert_one(deadline_doc.copy())
    return Deadline(**deadline_doc)


@api_router.get("/deadlines", response_model=List[Deadline])
async def get_deadlines():
    deadlines = await db.deadlines.find({}, {"_id": 0}).sort("due_date", 1).to_list(500)
    return deadlines


@api_router.put("/deadlines/{deadline_id}", response_model=Deadline)
async def update_deadline(deadline_id: str, payload: DeadlineUpdate):
    updates = {key: value for key, value in payload.model_dump().items() if value is not None}
    updates["updated_at"] = now_iso()
    result = await db.deadlines.update_one({"id": deadline_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Deadline not found")

    updated_deadline = await db.deadlines.find_one({"id": deadline_id}, {"_id": 0})
    if not updated_deadline:
        raise HTTPException(status_code=404, detail="Deadline not found")
    return updated_deadline


@api_router.delete("/deadlines/{deadline_id}")
async def delete_deadline(deadline_id: str):
    result = await db.deadlines.delete_one({"id": deadline_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deadline not found")
    return {"success": True, "message": "Deadline deleted"}


@api_router.get("/reminders", response_model=List[ReminderItem])
async def get_deadline_reminders():
    now = datetime.now(timezone.utc)
    deadlines = await db.deadlines.find({"completed": False}, {"_id": 0}).to_list(500)
    reminders: List[ReminderItem] = []

    for item in deadlines:
        due_date = parse_iso_date(item.get("due_date"))
        if not due_date:
            continue
        days_left = (due_date.date() - now.date()).days
        urgency: Literal["overdue", "due_soon", "upcoming"]
        if days_left < 0:
            urgency = "overdue"
        elif days_left <= 3:
            urgency = "due_soon"
        else:
            urgency = "upcoming"

        if urgency in {"overdue", "due_soon"}:
            reminders.append(
                ReminderItem(
                    id=item["id"],
                    title=item["title"],
                    due_date=item["due_date"],
                    days_left=days_left,
                    urgency=urgency,
                )
            )

    reminders.sort(key=lambda reminder: reminder.days_left)
    return reminders


@api_router.post("/focus-sessions", response_model=FocusSession)
async def create_focus_session(payload: FocusSessionCreate):
    timestamp = now_iso()
    session_doc = {
        "id": str(uuid.uuid4()),
        "duration_minutes": payload.duration_minutes,
        "started_at": payload.started_at or timestamp,
        "completed": payload.completed,
        "created_at": timestamp,
    }
    await db.focus_sessions.insert_one(session_doc.copy())
    return FocusSession(**session_doc)


@api_router.get("/focus-sessions", response_model=List[FocusSession])
async def get_focus_sessions():
    sessions = await db.focus_sessions.find({}, {"_id": 0}).sort("created_at", -1).to_list(300)
    return sessions


@api_router.get("/analytics/summary", response_model=AnalyticsSummary)
async def get_analytics_summary():
    now = datetime.now(timezone.utc)

    tasks = await db.tasks.find({}, {"_id": 0}).to_list(2000)
    deadlines = await db.deadlines.find({"completed": False}, {"_id": 0}).to_list(2000)
    focus_sessions = await db.focus_sessions.find({}, {"_id": 0}).to_list(2000)

    tasks_total = len(tasks)
    tasks_completed = len([task for task in tasks if task.get("completed")])
    focus_minutes_total = sum(int(session.get("duration_minutes", 0)) for session in focus_sessions)

    upcoming_deadlines = count_upcoming_deadlines(deadlines, now)
    subject_breakdown = build_subject_breakdown(tasks)
    productivity_score = calculate_productivity_score(tasks_total, tasks_completed, focus_minutes_total)

    return AnalyticsSummary(
        tasks_total=tasks_total,
        tasks_completed=tasks_completed,
        deadlines_upcoming=upcoming_deadlines,
        focus_minutes_total=focus_minutes_total,
        focus_sessions_count=len(focus_sessions),
        productivity_score=productivity_score,
        subject_breakdown=subject_breakdown,
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()