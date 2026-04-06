import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrutalCard } from "@/components/BrutalCard";

const DASHBOARD_MOTION_PROPS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const toReadableDate = (value) => {
  if (!value) {
    return "No date";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
};

export default function DashboardPage({ tasks, deadlines, analytics, plans }) {
  const pendingTasks = tasks.filter((task) => !task.completed).slice(0, 4);
  const upcomingDeadlines = deadlines.filter((deadline) => !deadline.completed).slice(0, 5);
  const latestPlan = plans[0];

  return (
    <section className="space-y-8" data-testid="dashboard-page-root">
      <motion.div className="grid grid-cols-1 gap-8 lg:grid-cols-3" {...DASHBOARD_MOTION_PROPS}>
        <div className="brutal-card card-appear overflow-hidden border-2 border-[#18181b] bg-white lg:col-span-2" data-testid="dashboard-hero-card">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="space-y-5 p-7">
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-600" data-testid="dashboard-hero-label">
                Your daily sanctuary
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl" data-testid="dashboard-hero-title">
                Calm plan. <br /> Bold progress.
              </h2>
              <p className="text-sm md:text-base" data-testid="dashboard-hero-description">
                Build your AI timetable, execute focused blocks, and stay ahead of every deadline.
              </p>
              <Button
                asChild
                className="rounded-full border-2 border-[#18181b] bg-[#18181b] px-7 py-6 font-bold text-white transition-transform hover:scale-105"
                data-testid="dashboard-open-planner-button"
              >
                <Link to="/planner">
                  Open AI Planner <ArrowRight className="ml-1" size={16} />
                </Link>
              </Button>
            </div>
            <div className="relative aspect-[4/3] md:aspect-auto" data-testid="dashboard-hero-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1650661926447-9efb2610f64c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwxfHxhZXN0aGV0aWMlMjBzdHVkeSUyMGRlc2slMjBzZXR1cCUyMHN0dWRlbnR8ZW58MHx8fHwxNzczNjQyMDcwfDA&ixlib=rb-4.1.0&q=85"
                alt="Study desk with planner"
                className="h-full w-full object-cover object-center"
                data-testid="dashboard-hero-image"
              />
            </div>
          </div>
        </div>

        <BrutalCard
          className="bg-[#fecaca]"
          title="Today at a glance"
          subtitle="Core metrics"
          cardTestId="dashboard-summary-card"
        >
          <div className="space-y-4 text-sm md:text-base">
            <div className="flex items-center justify-between" data-testid="dashboard-metric-pending-tasks-row">
              <span>Pending tasks</span>
              <strong data-testid="dashboard-metric-pending-tasks-value">{pendingTasks.length}</strong>
            </div>
            <div className="flex items-center justify-between" data-testid="dashboard-metric-focus-minutes-row">
              <span>Focus minutes</span>
              <strong data-testid="dashboard-metric-focus-minutes-value">{analytics.focus_minutes_total}</strong>
            </div>
            <div className="flex items-center justify-between" data-testid="dashboard-metric-score-row">
              <span>Productivity score</span>
              <strong data-testid="dashboard-metric-score-value">{analytics.productivity_score}%</strong>
            </div>
          </div>
        </BrutalCard>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4" data-testid="dashboard-bento-grid">
        <BrutalCard className="bg-[#fecaca] md:col-span-1" title="Focus" subtitle="Pomodoro readiness" cardTestId="dashboard-focus-card">
          <div className="space-y-3">
            <p className="text-sm" data-testid="dashboard-focus-text">Start a 25-minute sprint and log your session.</p>
            <Button
              asChild
              className="rounded-full border-2 border-[#18181b] bg-white text-[#18181b] hover:bg-[#18181b] hover:text-white"
              data-testid="dashboard-go-focus-button"
            >
              <Link to="/focus">Go to Focus</Link>
            </Button>
          </div>
        </BrutalCard>

        <BrutalCard className="bg-white md:col-span-2" title="Today's Plan" subtitle="From your latest AI schedule" cardTestId="dashboard-latest-plan-card">
          <div className="space-y-3" data-testid="dashboard-latest-plan-content">
            {latestPlan ? (
              latestPlan.generated_schedule.slice(0, 2).map((day, index) => (
                <div className="border-b-2 border-[#18181b] pb-3" key={`${day.day}-${index}`} data-testid={`dashboard-plan-day-${index}`}>
                  <p className="text-sm font-semibold" data-testid={`dashboard-plan-day-${index}-name`}>{day.day}</p>
                  <p className="text-sm" data-testid={`dashboard-plan-day-${index}-topics`}>{day.topics.join(", ")}</p>
                </div>
              ))
            ) : (
              <p className="text-sm" data-testid="dashboard-empty-plan-message">No AI plan yet. Generate one in AI Planner.</p>
            )}
          </div>
        </BrutalCard>

        <BrutalCard className="bg-[#bbf7d0] md:col-span-1" title="Progress" subtitle="Task completion" cardTestId="dashboard-progress-card">
          <div className="space-y-2">
            <p className="text-sm" data-testid="dashboard-progress-count">
              {analytics.tasks_completed} / {analytics.tasks_total} tasks done
            </p>
            <div className="h-3 w-full border-2 border-[#18181b] bg-white" data-testid="dashboard-progress-bar-track">
              <div
                className="h-full bg-[#18181b]"
                style={{ width: `${analytics.tasks_total ? (analytics.tasks_completed / analytics.tasks_total) * 100 : 0}%` }}
                data-testid="dashboard-progress-bar-fill"
              />
            </div>
          </div>
        </BrutalCard>
      </div>

      <BrutalCard
        className="bg-[#bfdbfe]"
        title="Upcoming Deadlines"
        subtitle="Stay ahead of critical dates"
        cardTestId="dashboard-deadline-card"
      >
        <div className="space-y-3" data-testid="dashboard-deadline-list">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm" data-testid="dashboard-deadline-empty">No upcoming deadlines right now.</p>
          ) : (
            upcomingDeadlines.map((deadline, index) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#18181b] pb-3"
                key={deadline.id}
                data-testid={`dashboard-deadline-item-${index}`}
              >
                <div>
                  <p className="font-medium" data-testid={`dashboard-deadline-item-${index}-title`}>{deadline.title}</p>
                  <p className="text-sm" data-testid={`dashboard-deadline-item-${index}-date`}>
                    Due {toReadableDate(deadline.due_date)}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm" data-testid={`dashboard-deadline-item-${index}-status`}>
                  {deadline.completed ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                  {deadline.completed ? "Done" : "Active"}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-full border-2 border-[#18181b] bg-[#18181b] px-7 py-6 font-bold text-white transition-transform hover:scale-105"
            data-testid="dashboard-open-deadlines-button"
          >
            <Link to="/deadlines">Manage Deadlines</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-2 border-[#18181b] bg-white px-7 py-6 font-bold text-[#18181b] hover:bg-[#18181b] hover:text-white"
            data-testid="dashboard-open-analytics-button"
          >
            <Link to="/analytics">
              View Analytics <Sparkles className="ml-1" size={16} />
            </Link>
          </Button>
        </div>
      </BrutalCard>
    </section>
  );
}
