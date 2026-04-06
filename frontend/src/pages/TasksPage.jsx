import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrutalCard } from "@/components/BrutalCard";
import { DatePickerField } from "@/components/DatePickerField";

const DEFAULT_ESTIMATED_MINUTES = 45;
const ACTION_ICON_SIZE = 15;
const TASK_STAGGER_DELAY = 0.05;
const TASK_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * TASK_STAGGER_DELAY },
  }),
};

const toDisplayDate = (value) => {
  if (!value) {
    return "No due date";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

export default function TasksPage({ submittingTask, tasks, onAddTask, onToggleTask, onDeleteTask }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(DEFAULT_ESTIMATED_MINUTES);

  const submitTask = async (event) => {
    event.preventDefault();
    await onAddTask({
      title,
      subject,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      estimated_minutes: Number(estimatedMinutes),
      completed: false,
    });
    setTitle("");
    setSubject("General");
    setPriority("medium");
    setDueDate("");
    setEstimatedMinutes(DEFAULT_ESTIMATED_MINUTES);
  };

  return (
    <section className="space-y-8" data-testid="tasks-page-root">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BrutalCard
          className="bg-[#bfdbfe]"
          title="Create Daily Task"
          subtitle="Quickly add what needs to get done."
          cardTestId="task-create-card"
        >
          <form className="space-y-5" onSubmit={submitTask} data-testid="task-create-form">
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-sm font-medium" data-testid="task-title-label">Task title</label>
              <Input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="Solve chapter 5 practice questions"
                className="border-2 border-[#18181b] rounded-none"
                data-testid="task-title-input"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="task-subject" className="text-sm font-medium" data-testid="task-subject-label">Subject</label>
                <Input
                  id="task-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="border-2 border-[#18181b] rounded-none"
                  data-testid="task-subject-input"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="task-priority" className="text-sm font-medium" data-testid="task-priority-label">Priority</label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="h-10 w-full border-2 border-[#18181b] bg-white px-3 text-sm"
                  data-testid="task-priority-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DatePickerField
                id="task-due-date"
                label="Due date"
                value={dueDate}
                onChange={setDueDate}
                testIdPrefix="task-due-date"
              />
              <div className="space-y-2">
                <label htmlFor="task-estimate" className="text-sm font-medium" data-testid="task-estimate-label">
                  Estimated minutes
                </label>
                <Input
                  id="task-estimate"
                  type="number"
                  min="5"
                  max="240"
                  value={estimatedMinutes}
                  onChange={(event) => setEstimatedMinutes(event.target.value)}
                  className="border-2 border-[#18181b] rounded-none"
                  data-testid="task-estimate-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submittingTask || !title.trim()}
              className="w-full rounded-full border-2 border-[#18181b] bg-[#18181b] py-6 text-base font-bold text-white transition-transform hover:scale-105"
              data-testid="task-submit-button"
            >
              <Plus className="mr-2" size={16} />
              {submittingTask ? "Adding..." : "Add Task"}
            </Button>
          </form>
        </BrutalCard>

        <BrutalCard
          className="bg-white"
          title="Task Queue"
          subtitle="Check off tasks as you complete them."
          cardTestId="task-list-card"
        >
          <div className="space-y-3" data-testid="task-list-wrap">
            {tasks.length === 0 ? (
              <p className="text-sm" data-testid="task-empty-message">No tasks yet. Add your first task.</p>
            ) : (
              tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  custom={index}
                  variants={TASK_ITEM_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#18181b] pb-3"
                  data-testid={`task-item-${index}`}
                >
                  <div className="space-y-1">
                    <p
                      className={`font-medium ${task.completed ? "line-through text-zinc-500" : ""}`}
                      data-testid={`task-item-${index}-title`}
                    >
                      {task.title}
                    </p>
                    <p className="text-sm" data-testid={`task-item-${index}-meta`}>
                      {task.subject} • {task.priority} • {toDisplayDate(task.due_date)} • {task.estimated_minutes} min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => onToggleTask(task)}
                      className="rounded-full border-2 border-[#18181b] bg-[#bbf7d0] text-[#18181b] hover:bg-[#18181b] hover:text-white"
                      data-testid={`task-item-${index}-toggle-button`}
                    >
                      <Check size={ACTION_ICON_SIZE} />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="rounded-full border-2 border-[#18181b] bg-[#fecaca] text-[#18181b] hover:bg-[#18181b] hover:text-white"
                      data-testid={`task-item-${index}-delete-button`}
                    >
                      <Trash2 size={ACTION_ICON_SIZE} />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </BrutalCard>
      </div>
    </section>
  );
}
