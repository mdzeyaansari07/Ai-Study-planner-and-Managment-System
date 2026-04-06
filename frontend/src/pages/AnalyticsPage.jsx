import { motion } from "framer-motion";
import { BrutalCard } from "@/components/BrutalCard";

const metricCards = [
  { key: "tasks_total", label: "Total Tasks", bg: "bg-[#bfdbfe]" },
  { key: "tasks_completed", label: "Completed Tasks", bg: "bg-[#bbf7d0]" },
  { key: "focus_minutes_total", label: "Focus Minutes", bg: "bg-[#fecaca]" },
  { key: "productivity_score", label: "Productivity Score", bg: "bg-[#e9d5ff]", suffix: "%" },
];

const ANALYTICS_CARD_STAGGER = 0.05;
const ANALYTICS_CARD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * ANALYTICS_CARD_STAGGER },
  }),
};

export default function AnalyticsPage({ analytics }) {
  const completionRate = analytics.tasks_total
    ? Math.round((analytics.tasks_completed / analytics.tasks_total) * 100)
    : 0;

  return (
    <section className="space-y-8" data-testid="analytics-page-root">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4" data-testid="analytics-metrics-grid">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.key}
            custom={index}
            variants={ANALYTICS_CARD_VARIANTS}
            initial="hidden"
            animate="visible"
          >
            <BrutalCard
              className={metric.bg}
              title={metric.label}
              subtitle="Live planner data"
              cardTestId={`analytics-metric-${metric.key}-card`}
            >
              <p className="text-3xl font-semibold md:text-4xl" data-testid={`analytics-metric-${metric.key}-value`}>
                {analytics[metric.key]}
                {metric.suffix || ""}
              </p>
            </BrutalCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BrutalCard className="bg-white" title="Completion Trend" subtitle="Task completion quality" cardTestId="analytics-completion-card">
          <div className="space-y-4" data-testid="analytics-completion-wrap">
            <p className="text-sm md:text-base" data-testid="analytics-completion-rate-text">
              You are currently completing <strong>{completionRate}%</strong> of your tasks.
            </p>
            <div className="h-4 w-full border-2 border-[#18181b] bg-[#f4f4f5]" data-testid="analytics-completion-track">
              <div
                className="h-full bg-[#18181b] transition-[width] duration-300"
                style={{ width: `${completionRate}%` }}
                data-testid="analytics-completion-fill"
              />
            </div>
            <p className="text-sm" data-testid="analytics-upcoming-deadlines-text">
              Upcoming active deadlines: <strong>{analytics.deadlines_upcoming}</strong>
            </p>
          </div>
        </BrutalCard>

        <BrutalCard className="bg-[#bbf7d0]" title="Subject Distribution" subtitle="Where your effort is going" cardTestId="analytics-subject-card">
          <div className="space-y-4" data-testid="analytics-subject-list">
            {analytics.subject_breakdown.length === 0 ? (
              <p className="text-sm" data-testid="analytics-subject-empty">No subject data yet. Add tasks to see insights.</p>
            ) : (
              analytics.subject_breakdown.map((item, index) => {
                const ratio = item.total_tasks ? Math.round((item.completed_tasks / item.total_tasks) * 100) : 0;
                return (
                  <div key={`${item.subject}-${index}`} data-testid={`analytics-subject-item-${index}`}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span data-testid={`analytics-subject-item-${index}-name`}>{item.subject}</span>
                      <span data-testid={`analytics-subject-item-${index}-ratio`}>{ratio}% completed</span>
                    </div>
                    <div className="h-3 w-full border-2 border-[#18181b] bg-white" data-testid={`analytics-subject-item-${index}-track`}>
                      <div
                        className="h-full bg-[#18181b] transition-[width] duration-300"
                        style={{ width: `${ratio}%` }}
                        data-testid={`analytics-subject-item-${index}-fill`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </BrutalCard>
      </div>
    </section>
  );
}
