# PRD — AI Study Planner & Productivity Assistant

## Original Problem Statement
"AI Study Planner & Productivity Assistant using html css java script and add node .js for the ai backend"

## User Choices Captured
- Use default template stack: **React + FastAPI + MongoDB**
- Include all core features:
  - Smart AI study timetable generator
  - Daily to-do/task management
  - Pomodoro focus timer
  - Deadlines with reminders
  - Progress analytics dashboard
- AI model: **OpenAI GPT-5.2**
- Key strategy: **Emergent universal key**
- Authentication: **No login (MVP)**

## Architecture Decisions
- Frontend: React (CRA+CRACO), Tailwind, Shadcn components, Framer Motion
- Backend: FastAPI, Motor (MongoDB), emergentintegrations chat SDK
- Database: MongoDB collections
  - `tasks`, `deadlines`, `focus_sessions`, `study_plans`, `status_checks`
- API style: RESTful CRUD + analytics + AI generation endpoint
- Key integrations:
  - `EMERGENT_LLM_KEY` in backend `.env`
  - `LlmChat(...).with_model("openai", "gpt-5.2")`

## User Personas
- High-school and college students preparing for exams
- Self-learners needing routine and focus discipline
- Students with multiple deadlines needing visibility and reminders

## Core Requirements (Static)
1. Generate a realistic multi-day AI study plan from goals and constraints
2. Track tasks with completion flow and priorities
3. Run Pomodoro sessions and store focus logs
4. Track deadlines and highlight urgent reminders
5. Visualize productivity with summary analytics and subject distribution
6. Responsive, testable UI with consistent interaction patterns

## What’s Implemented
- **2026-03-16**
  - Full multi-page UI: Dashboard, AI Planner, Tasks, Focus, Deadlines, Analytics
  - FastAPI endpoints for:
    - `/api/plans/generate`, `/api/plans`
    - `/api/tasks` CRUD
    - `/api/deadlines` CRUD
    - `/api/reminders`
    - `/api/focus-sessions`
    - `/api/analytics/summary`
  - Mongo persistence and response models excluding `_id` to avoid ObjectId serialization
  - AI planner integrated with OpenAI GPT-5.2 via Emergent universal key
  - Pomodoro logging reflected in analytics
  - Deadline reminders for overdue and due-soon items
  - Bento-style "Zen-Brutalism" design implementation per generated design guidelines
  - Added robust `data-testid` coverage for interactive and critical UI elements
  - Self-tests + testing agent pass across API and frontend flows

- **2026-03-16 (Quality pass after review findings)**
  - Hook safety updates (`useStudyData`, `use-toast`)
  - Extracted animation constants/variants to reduce inline object props
  - Replaced native date inputs with shared calendar picker component
  - Reduced complexity in backend plan parsing and analytics aggregation via helpers
  - App route rendering extracted into dedicated routes component
  - Production hygiene improvement in `craco.config.js` warning path

## Prioritized Backlog
### P0 (Next must-have)
- Add edit forms for tasks/deadlines (currently create/toggle/delete flow)
- Add bulk completion/clear filters for faster task operations

### P1 (High value)
- Advanced analytics charts (weekly trend, streak timeline, subject heatmap)
- Configurable Pomodoro presets + short/long break logic
- Export/share weekly plan (PDF/image)

### P2 (Future enhancements)
- User accounts + cloud sync per student
- Notification channels (email/push/telegram reminders)
- Smart plan rebalancing based on missed sessions

## Next Tasks List
1. Add task/deadline edit modal flows with validation
2. Introduce filter/search on task and deadline lists
3. Add streak-based analytics widgets and trend chart
4. Add planner “regenerate one day” action for schedule flexibility
