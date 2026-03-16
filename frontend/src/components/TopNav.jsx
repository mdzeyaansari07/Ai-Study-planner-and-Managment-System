import { Link, NavLink } from "react-router-dom";
import { BarChart3, Brain, CalendarClock, CheckSquare, House, Timer } from "lucide-react";

const routes = [
  { to: "/dashboard", label: "Dashboard", icon: House },
  { to: "/planner", label: "AI Planner", icon: Brain },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/deadlines", label: "Deadlines", icon: CalendarClock },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export const TopNav = () => {
  return (
    <header className="sticky top-0 z-40 bg-[#fafaf9]/90 px-4 pb-4 pt-6 backdrop-blur md:px-8" data-testid="top-nav-wrapper">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 text-[#18181b] transition-colors hover:text-zinc-700"
          data-testid="brand-home-link"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center border-2 border-[#18181b] bg-[#bbf7d0] text-lg font-bold">
            SP
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl">Study Planner AI</h1>
            <p className="text-sm text-zinc-600" data-testid="brand-subtitle">
              Plan smarter, focus deeper, finish earlier.
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-wrap gap-3" data-testid="top-nav-links">
        {routes.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "inline-flex items-center gap-2 rounded-full border-2 border-[#18181b] px-4 py-2 text-sm font-medium transition-transform",
                isActive ? "bg-[#18181b] text-white" : "bg-white text-[#18181b] hover:-translate-y-1",
              ].join(" ")
            }
            data-testid={`nav-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};
