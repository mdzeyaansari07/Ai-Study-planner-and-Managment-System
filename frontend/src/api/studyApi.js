import axios from "axios";

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getTasks = async () => (await api.get("/tasks")).data;
export const createTask = async (payload) => (await api.post("/tasks", payload)).data;
export const updateTask = async (taskId, payload) => (await api.put(`/tasks/${taskId}`, payload)).data;
export const removeTask = async (taskId) => (await api.delete(`/tasks/${taskId}`)).data;

export const getDeadlines = async () => (await api.get("/deadlines")).data;
export const createDeadline = async (payload) => (await api.post("/deadlines", payload)).data;
export const updateDeadline = async (deadlineId, payload) => (await api.put(`/deadlines/${deadlineId}`, payload)).data;
export const removeDeadline = async (deadlineId) => (await api.delete(`/deadlines/${deadlineId}`)).data;
export const getReminders = async () => (await api.get("/reminders")).data;

export const getPlans = async () => (await api.get("/plans")).data;
export const generateStudyPlan = async (payload) => (await api.post("/plans/generate", payload)).data;

export const getFocusSessions = async () => (await api.get("/focus-sessions")).data;
export const createFocusSession = async (payload) => (await api.post("/focus-sessions", payload)).data;

export const getAnalyticsSummary = async () => (await api.get("/analytics/summary")).data;
