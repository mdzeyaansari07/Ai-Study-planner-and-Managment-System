import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import {
  createDeadline,
  createFocusSession,
  createTask,
  generateStudyPlan,
  getAnalyticsSummary,
  getDeadlines,
  getFocusSessions,
  getPlans,
  getReminders,
  getTasks,
  removeDeadline,
  removeTask,
  updateDeadline,
  updateTask,
} from "@/api/studyApi";

const EMPTY_ANALYTICS = {
  tasks_total: 0,
  tasks_completed: 0,
  deadlines_upcoming: 0,
  focus_minutes_total: 0,
  focus_sessions_count: 0,
  productivity_score: 0,
  subject_breakdown: [],
};

export const useStudyData = () => {
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingDeadline, setSubmittingDeadline] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);

  const loadAllData = useCallback(async () => {
    try {
      const [taskData, deadlineData, reminderData, planData, sessionData, analyticsData] = await Promise.all([
        getTasks(),
        getDeadlines(),
        getReminders(),
        getPlans(),
        getFocusSessions(),
        getAnalyticsSummary(),
      ]);
      setTasks(taskData);
      setDeadlines(deadlineData);
      setReminders(reminderData);
      setPlans(planData);
      setFocusSessions(sessionData);
      setAnalytics(analyticsData);
    } catch {
      toast.error("Unable to load planner data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [
    getAnalyticsSummary,
    getDeadlines,
    getFocusSessions,
    getPlans,
    getReminders,
    getTasks,
    setAnalytics,
    setDeadlines,
    setFocusSessions,
    setLoading,
    setPlans,
    setReminders,
    setTasks,
  ]);

  const mutateAndRefresh = async ({ action, successMessage, errorMessage, onStart, onDone }) => {
    try {
      if (onStart) {
        onStart();
      }
      await action();
      toast.success(successMessage);
      await loadAllData();
    } catch {
      toast.error(errorMessage);
    } finally {
      if (onDone) {
        onDone();
      }
    }
  };

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const addTask = async (payload) => {
    await mutateAndRefresh({
      action: () => createTask(payload),
      successMessage: "Task added.",
      errorMessage: "Could not add task.",
      onStart: () => setSubmittingTask(true),
      onDone: () => setSubmittingTask(false),
    });
  };

  const toggleTask = async (task) => {
    await mutateAndRefresh({
      action: () => updateTask(task.id, { completed: !task.completed }),
      successMessage: task.completed ? "Task reopened." : "Task completed.",
      errorMessage: "Could not update task.",
    });
  };

  const deleteTask = async (taskId) => {
    await mutateAndRefresh({
      action: () => removeTask(taskId),
      successMessage: "Task deleted.",
      errorMessage: "Could not delete task.",
    });
  };

  const addDeadline = async (payload) => {
    await mutateAndRefresh({
      action: () => createDeadline(payload),
      successMessage: "Deadline added.",
      errorMessage: "Could not add deadline.",
      onStart: () => setSubmittingDeadline(true),
      onDone: () => setSubmittingDeadline(false),
    });
  };

  const toggleDeadline = async (deadline) => {
    await mutateAndRefresh({
      action: () => updateDeadline(deadline.id, { completed: !deadline.completed }),
      successMessage: deadline.completed ? "Deadline moved back to active." : "Deadline marked complete.",
      errorMessage: "Could not update deadline.",
    });
  };

  const deleteDeadline = async (deadlineId) => {
    await mutateAndRefresh({
      action: () => removeDeadline(deadlineId),
      successMessage: "Deadline removed.",
      errorMessage: "Could not delete deadline.",
    });
  };

  const logFocusSession = async (durationMinutes) => {
    await mutateAndRefresh({
      action: () =>
        createFocusSession({
          duration_minutes: durationMinutes,
          completed: true,
          started_at: new Date().toISOString(),
        }),
      successMessage: "Focus session logged.",
      errorMessage: "Unable to log focus session.",
    });
  };

  const generatePlan = async (payload) => {
    await mutateAndRefresh({
      action: () => generateStudyPlan(payload),
      successMessage: "AI schedule generated.",
      errorMessage: "AI plan generation failed.",
      onStart: () => setGeneratingPlan(true),
      onDone: () => setGeneratingPlan(false),
    });
  };

  return {
    loading,
    generatingPlan,
    submittingTask,
    submittingDeadline,
    tasks,
    deadlines,
    reminders,
    plans,
    focusSessions,
    analytics,
    addTask,
    toggleTask,
    deleteTask,
    addDeadline,
    toggleDeadline,
    deleteDeadline,
    logFocusSession,
    generatePlan,
  };
};
