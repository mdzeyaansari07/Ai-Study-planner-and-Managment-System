import { useState } from "react";
import { motion } from "framer-motion";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BrutalCard } from "@/components/BrutalCard";

export default function PlannerPage({ generatingPlan, latestPlan, onGeneratePlan }) {
  const [goals, setGoals] = useState("");
  const [priorities, setPriorities] = useState("");
  const [availableHours, setAvailableHours] = useState(3);
  const [studyDays, setStudyDays] = useState(7);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onGeneratePlan({
      goals,
      priorities,
      available_hours_per_day: Number(availableHours),
      study_days: Number(studyDays),
    });
  };

  return (
    <section className="space-y-8" data-testid="planner-page-root">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-2"
      >
        <BrutalCard
          className="bg-[#e9d5ff]"
          title="AI Study Timetable Generator"
          subtitle="Describe your goal and get a practical, day-by-day plan."
          cardTestId="planner-form-card"
        >
          <form className="space-y-6" onSubmit={handleSubmit} data-testid="planner-form">
            <div className="space-y-2">
              <label htmlFor="planner-goals" className="text-sm font-medium" data-testid="planner-goals-label">
                Study Goals
              </label>
              <Textarea
                id="planner-goals"
                value={goals}
                onChange={(event) => setGoals(event.target.value)}
                placeholder="Example: Math finals, organic chemistry revision, and essay writing practice"
                className="min-h-24 border-2 border-[#18181b] rounded-none"
                required
                data-testid="planner-goals-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="planner-priorities" className="text-sm font-medium" data-testid="planner-priorities-label">
                Priorities
              </label>
              <Input
                id="planner-priorities"
                value={priorities}
                onChange={(event) => setPriorities(event.target.value)}
                placeholder="Weak topics first, daily revision, practice questions"
                className="border-2 border-[#18181b] rounded-none"
                data-testid="planner-priorities-input"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="planner-hours" className="text-sm font-medium" data-testid="planner-hours-label">
                  Hours available per day
                </label>
                <Input
                  id="planner-hours"
                  type="number"
                  min="1"
                  max="12"
                  value={availableHours}
                  onChange={(event) => setAvailableHours(event.target.value)}
                  className="border-2 border-[#18181b] rounded-none"
                  data-testid="planner-hours-input"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="planner-days" className="text-sm font-medium" data-testid="planner-days-label">
                  Study days
                </label>
                <Input
                  id="planner-days"
                  type="number"
                  min="3"
                  max="30"
                  value={studyDays}
                  onChange={(event) => setStudyDays(event.target.value)}
                  className="border-2 border-[#18181b] rounded-none"
                  data-testid="planner-days-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-full border-2 border-[#18181b] bg-[#18181b] py-6 text-base font-bold text-white transition-transform hover:scale-105"
              disabled={generatingPlan || !goals.trim()}
              data-testid="planner-generate-button"
            >
              <WandSparkles className="mr-2" size={16} />
              {generatingPlan ? "Generating..." : "Generate AI Study Plan"}
            </Button>
          </form>
        </BrutalCard>

        <BrutalCard
          className="bg-white"
          title="Latest Generated Plan"
          subtitle="Use this as your daily execution roadmap."
          cardTestId="planner-result-card"
        >
          {latestPlan ? (
            <div className="space-y-4" data-testid="planner-generated-plan-wrap">
              <p className="text-sm md:text-base" data-testid="planner-generated-plan-summary">{latestPlan.summary}</p>
              {latestPlan.generated_schedule.map((day, index) => (
                <div className="border-b-2 border-[#18181b] pb-3" key={`${day.day}-${index}`} data-testid={`planner-day-item-${index}`}>
                  <p className="font-medium" data-testid={`planner-day-item-${index}-name`}>{day.day}</p>
                  <p className="text-sm" data-testid={`planner-day-item-${index}-topics`}>
                    Topics: {day.topics.join(", ")}
                  </p>
                  <p className="text-sm" data-testid={`planner-day-item-${index}-minutes`}>
                    Focus: {day.focus_minutes} min
                  </p>
                  <p className="text-sm" data-testid={`planner-day-item-${index}-notes`}>{day.notes}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" data-testid="planner-empty-message">
              No plan yet. Fill the form and generate your first AI timetable.
            </p>
          )}
        </BrutalCard>
      </motion.div>
    </section>
  );
}
