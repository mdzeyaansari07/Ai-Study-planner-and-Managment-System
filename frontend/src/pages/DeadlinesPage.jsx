import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BrutalCard } from "@/components/BrutalCard";
import { DatePickerField } from "@/components/DatePickerField";

const formatDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const urgencyColor = (daysLeft) => {
  if (daysLeft < 0) {
    return "bg-[#fecaca]";
  }
  if (daysLeft <= 2) {
    return "bg-[#fed7aa]";
  }
  return "bg-[#bbf7d0]";
};

const ACTION_ICON_SIZE = 15;
const DEADLINE_STAGGER_DELAY = 0.05;
const DEADLINE_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * DEADLINE_STAGGER_DELAY },
  }),
};

const toDateInput = (value) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
};

export default function DeadlinesPage({
  submittingDeadline,
  deadlines,
  reminders,
  onAddDeadline,
  onToggleDeadline,
  onDeleteDeadline,
  onUpdateDeadline,
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [dueDate, setDueDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [notes, setNotes] = useState("");
  const [editingDeadlineId, setEditingDeadlineId] = useState("");
  const [deadlineDraft, setDeadlineDraft] = useState({
    title: "",
    subject: "General",
    dueDate: "",
    reminderDate: "",
    notes: "",
  });

  const submitDeadline = async (event) => {
    event.preventDefault();
    await onAddDeadline({
      title,
      subject,
      due_date: new Date(dueDate).toISOString(),
      reminder_date: reminderDate ? new Date(reminderDate).toISOString() : null,
      notes,
      completed: false,
    });
    setTitle("");
    setSubject("General");
    setDueDate("");
    setReminderDate("");
    setNotes("");
  };

  const startDeadlineEdit = (deadline) => {
    setEditingDeadlineId(deadline.id);
    setDeadlineDraft({
      title: deadline.title,
      subject: deadline.subject,
      dueDate: toDateInput(deadline.due_date),
      reminderDate: toDateInput(deadline.reminder_date),
      notes: deadline.notes || "",
    });
  };

  const cancelDeadlineEdit = () => {
    setEditingDeadlineId("");
  };

  const saveDeadlineEdit = async () => {
    if (!editingDeadlineId || !deadlineDraft.title.trim() || !deadlineDraft.dueDate) {
      return;
    }

    await onUpdateDeadline(editingDeadlineId, {
      title: deadlineDraft.title,
      subject: deadlineDraft.subject,
      due_date: new Date(deadlineDraft.dueDate).toISOString(),
      reminder_date: deadlineDraft.reminderDate ? new Date(deadlineDraft.reminderDate).toISOString() : null,
      notes: deadlineDraft.notes,
    });
    setEditingDeadlineId("");
  };

  return (
    <section className="space-y-8" data-testid="deadlines-page-root">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BrutalCard
          className="bg-[#fed7aa]"
          title="Add Deadline"
          subtitle="Track exams, submissions, and milestones."
          cardTestId="deadline-form-card"
        >
          <form className="space-y-5" onSubmit={submitDeadline} data-testid="deadline-form">
            <div className="space-y-2">
              <label htmlFor="deadline-title" className="text-sm font-medium" data-testid="deadline-title-label">Title</label>
              <Input
                id="deadline-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="Math final exam"
                className="border-2 border-[#18181b] rounded-none"
                data-testid="deadline-title-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="deadline-subject" className="text-sm font-medium" data-testid="deadline-subject-label">Subject</label>
              <Input
                id="deadline-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="border-2 border-[#18181b] rounded-none"
                data-testid="deadline-subject-input"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DatePickerField
                id="deadline-due-date"
                label="Due date"
                value={dueDate}
                onChange={setDueDate}
                required
                testIdPrefix="deadline-due-date"
              />
              <DatePickerField
                id="deadline-reminder-date"
                label="Reminder date"
                value={reminderDate}
                onChange={setReminderDate}
                testIdPrefix="deadline-reminder-date"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="deadline-notes" className="text-sm font-medium" data-testid="deadline-notes-label">Notes</label>
              <Textarea
                id="deadline-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-20 border-2 border-[#18181b] rounded-none"
                data-testid="deadline-notes-input"
              />
            </div>

            <Button
              type="submit"
              disabled={submittingDeadline || !title.trim() || !dueDate}
              className="w-full rounded-full border-2 border-[#18181b] bg-[#18181b] py-6 text-base font-bold text-white transition-transform hover:scale-105"
              data-testid="deadline-submit-button"
            >
              {submittingDeadline ? "Adding..." : "Save Deadline"}
            </Button>
          </form>
        </BrutalCard>

        <BrutalCard className="bg-white" title="Deadline Alerts" subtitle="Critical reminders from your timeline" cardTestId="deadline-reminder-card">
          <div className="space-y-3" data-testid="deadline-reminder-list">
            {reminders.length === 0 ? (
              <p className="text-sm" data-testid="deadline-reminder-empty">No urgent reminders now.</p>
            ) : (
              reminders.map((item, index) => (
                <div
                  className={`flex items-center justify-between border-2 border-[#18181b] p-3 ${urgencyColor(item.days_left)}`}
                  key={item.id}
                  data-testid={`deadline-reminder-item-${index}`}
                >
                  <div>
                    <p className="font-medium" data-testid={`deadline-reminder-item-${index}-title`}>{item.title}</p>
                    <p className="text-sm" data-testid={`deadline-reminder-item-${index}-days`}>
                      {item.days_left < 0 ? `${Math.abs(item.days_left)} days overdue` : `${item.days_left} days left`}
                    </p>
                  </div>
                  <Bell size={18} />
                </div>
              ))
            )}
          </div>
        </BrutalCard>
      </div>

      <BrutalCard className="bg-[#bfdbfe]" title="All Deadlines" subtitle="Mark complete or remove as needed" cardTestId="deadline-list-card">
        <div className="space-y-3" data-testid="deadline-list-wrap">
          {deadlines.length === 0 ? (
            <p className="text-sm" data-testid="deadline-empty-message">No deadlines yet.</p>
          ) : (
            deadlines.map((deadline, index) => (
              <motion.div
                key={deadline.id}
                custom={index}
                variants={DEADLINE_ITEM_VARIANTS}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#18181b] pb-3"
                data-testid={`deadline-item-${index}`}
              >
                {editingDeadlineId === deadline.id ? (
                  <div className="w-full space-y-4" data-testid={`deadline-item-${index}-edit-wrap`}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium" data-testid={`deadline-item-${index}-edit-title-label`}>
                          Title
                        </label>
                        <Input
                          value={deadlineDraft.title}
                          onChange={(event) => setDeadlineDraft((prev) => ({ ...prev, title: event.target.value }))}
                          className="border-2 border-[#18181b] rounded-none"
                          data-testid={`deadline-item-${index}-edit-title-input`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" data-testid={`deadline-item-${index}-edit-subject-label`}>
                          Subject
                        </label>
                        <Input
                          value={deadlineDraft.subject}
                          onChange={(event) => setDeadlineDraft((prev) => ({ ...prev, subject: event.target.value }))}
                          className="border-2 border-[#18181b] rounded-none"
                          data-testid={`deadline-item-${index}-edit-subject-input`}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <DatePickerField
                        id={`deadline-edit-due-date-${index}`}
                        label="Due date"
                        value={deadlineDraft.dueDate}
                        onChange={(value) => setDeadlineDraft((prev) => ({ ...prev, dueDate: value }))}
                        required
                        testIdPrefix={`deadline-item-${index}-edit-due-date`}
                      />
                      <DatePickerField
                        id={`deadline-edit-reminder-date-${index}`}
                        label="Reminder date"
                        value={deadlineDraft.reminderDate}
                        onChange={(value) => setDeadlineDraft((prev) => ({ ...prev, reminderDate: value }))}
                        testIdPrefix={`deadline-item-${index}-edit-reminder-date`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" data-testid={`deadline-item-${index}-edit-notes-label`}>
                        Notes
                      </label>
                      <Textarea
                        value={deadlineDraft.notes}
                        onChange={(event) => setDeadlineDraft((prev) => ({ ...prev, notes: event.target.value }))}
                        className="min-h-20 border-2 border-[#18181b] rounded-none"
                        data-testid={`deadline-item-${index}-edit-notes-input`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={saveDeadlineEdit}
                        className="rounded-full border-2 border-[#18181b] bg-[#18181b] text-white hover:scale-105"
                        data-testid={`deadline-item-${index}-edit-save-button`}
                      >
                        <Save size={ACTION_ICON_SIZE} className="mr-1" />
                        Save
                      </Button>
                      <Button
                        type="button"
                        onClick={cancelDeadlineEdit}
                        className="rounded-full border-2 border-[#18181b] bg-white text-[#18181b] hover:bg-[#18181b] hover:text-white"
                        data-testid={`deadline-item-${index}-edit-cancel-button`}
                      >
                        <X size={ACTION_ICON_SIZE} className="mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium" data-testid={`deadline-item-${index}-title`}>{deadline.title}</p>
                      <p className="text-sm" data-testid={`deadline-item-${index}-meta`}>
                        {deadline.subject} • Due {formatDate(deadline.due_date)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => startDeadlineEdit(deadline)}
                        className="rounded-full border-2 border-[#18181b] bg-[#e9d5ff] text-[#18181b] hover:bg-[#18181b] hover:text-white"
                        data-testid={`deadline-item-${index}-edit-button`}
                      >
                        <Pencil size={ACTION_ICON_SIZE} />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onToggleDeadline(deadline)}
                        className="rounded-full border-2 border-[#18181b] bg-[#bbf7d0] text-[#18181b] hover:bg-[#18181b] hover:text-white"
                        data-testid={`deadline-item-${index}-toggle-button`}
                      >
                        <Check size={ACTION_ICON_SIZE} />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onDeleteDeadline(deadline.id)}
                        className="rounded-full border-2 border-[#18181b] bg-[#fecaca] text-[#18181b] hover:bg-[#18181b] hover:text-white"
                        data-testid={`deadline-item-${index}-delete-button`}
                      >
                        <Trash2 size={ACTION_ICON_SIZE} />
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ))
          )}
        </div>
      </BrutalCard>
    </section>
  );
}
