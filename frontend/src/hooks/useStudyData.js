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
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const addTask = async (payload) => {
    try {
      setSubmittingTask(true);
      await createTask(payload);
      toast.success("Task added.");
      await loadAllData();
    } catch {
      toast.error("Could not add task.");
    } finally {
      setSubmittingTask(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      await updateTask(task.id, { completed: !task.completed });
      toast.success(task.completed ? "Task reopened." : "Task completed.");
      await loadAllData();
    } catch {
      toast.error("Could not update task.");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await removeTask(taskId);
      toast.success("Task deleted.");
      await loadAllData();
    } catch {
      toast.error("Could not delete task.");
    }
  };

  const addDeadline = async (payload) => {
    try {
      setSubmittingDeadline(true);
      await createDeadline(payload);
      toast.success("Deadline added.");
      await loadAllData();
    } catch {
      toast.error("Could not add deadline.");
    } finally {
      setSubmittingDeadline(false);
    }
  };

  const toggleDeadline = async (deadline) => {
    try {
      await updateDeadline(deadline.id, { completed: !deadline.completed });
      toast.success(deadline.completed ? "Deadline moved back to active." : "Deadline marked complete.");
      await loadAllData();
    } catch {
      toast.error("Could not update deadline.");
    }
  };

  const deleteDeadline = async (deadlineId) => {
    try {
      await removeDeadline(deadlineId);
      toast.success("Deadline removed.");
      await loadAllData();
    } catch {
      toast.error("Could not delete deadline.");
    }
  };

  const logFocusSession = async (durationMinutes) => {
    try {
      await createFocusSession({
        duration_minutes: durationMinutes,
        completed: true,
        started_at: new Date().toISOString(),
      });
      toast.success("Focus session logged.");
      await loadAllData();
    } catch {
      toast.error("Unable to log focus session.");
    }
  };

  const generatePlan = async (payload) => {
    try {
      setGeneratingPlan(true);
      await generateStudyPlan(payload);
      toast.success("AI schedule generated.");
      await loadAllData();
    } catch {
      toast.error("AI plan generation failed.");
    } finally {
      setGeneratingPlan(false);
    }
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
