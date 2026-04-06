import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TopNav } from "@/components/TopNav";
import { useStudyData } from "@/hooks/useStudyData";
import DashboardPage from "@/pages/DashboardPage";
import PlannerPage from "@/pages/PlannerPage";
import TasksPage from "@/pages/TasksPage";
import FocusPage from "@/pages/FocusPage";
import DeadlinesPage from "@/pages/DeadlinesPage";
import AnalyticsPage from "@/pages/AnalyticsPage";

const PlannerRoutes = ({
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
}) => {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={<DashboardPage tasks={tasks} deadlines={deadlines} analytics={analytics} plans={plans} />}
      />
      <Route
        path="/planner"
        element={<PlannerPage generatingPlan={generatingPlan} latestPlan={plans[0]} onGeneratePlan={generatePlan} />}
      />
      <Route
        path="/tasks"
        element={
          <TasksPage
            submittingTask={submittingTask}
            tasks={tasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        }
      />
      <Route path="/focus" element={<FocusPage focusSessions={focusSessions} onLogSession={logFocusSession} />} />
      <Route
        path="/deadlines"
        element={
          <DeadlinesPage
            submittingDeadline={submittingDeadline}
            deadlines={deadlines}
            reminders={reminders}
            onAddDeadline={addDeadline}
            onToggleDeadline={toggleDeadline}
            onDeleteDeadline={deleteDeadline}
          />
        }
      />
      <Route path="/analytics" element={<AnalyticsPage analytics={analytics} />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  const {
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
  } = useStudyData();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter>
        <div className="planner-bg" data-testid="study-planner-app-shell">
          <TopNav />
          <main className="page-shell">
            {loading ? (
              <div
                className="brutal-card bg-white p-8 text-base md:text-lg"
                data-testid="global-loading-card"
              >
                Loading your study space...
              </div>
            ) : (
              <PlannerRoutes
                generatingPlan={generatingPlan}
                submittingTask={submittingTask}
                submittingDeadline={submittingDeadline}
                tasks={tasks}
                deadlines={deadlines}
                reminders={reminders}
                plans={plans}
                focusSessions={focusSessions}
                analytics={analytics}
                addTask={addTask}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                addDeadline={addDeadline}
                toggleDeadline={toggleDeadline}
                deleteDeadline={deleteDeadline}
                logFocusSession={logFocusSession}
                generatePlan={generatePlan}
              />
            )}
          </main>
          <Toaster data-testid="toast-root" position="top-right" richColors closeButton />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
