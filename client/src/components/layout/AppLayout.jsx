import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  CalendarClock,
  NotebookPen,
  CalendarDays,
  Sparkles,
  Archive,
  Menu,
  Moon,
  Sun,
  Globe,
  RotateCcw,
  LogOut,
} from "lucide-react";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

// The sidebar menu. Add a line here to add a page to the menu.
const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/tasks", label: "Tasks", icon: ListChecks },
  { to: "/app/timetable", label: "Timetable", icon: CalendarClock },
  { to: "/app/notes", label: "Notes", icon: NotebookPen },
  { to: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/app/assistant", label: "AI assistant", icon: Sparkles },
  { to: "/app/backup", label: "Backup", icon: Archive },
];

// Light / dark theme. Remembers the choice; follows the computer until you pick.
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("cos_theme");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  }, [theme]);

  const isDark = theme
    ? theme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;

  function toggle() {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("cos_theme", next);
    } catch {
      // storage can be blocked; the theme still changes for this visit
    }
  }

  return { isDark, toggle };
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { resetAll } = useData();
  const { user, signOut } = useAuth();
  const { isDark, toggle } = useTheme();
  const [open, setOpen] = useState(false); // mobile sidebar

  // Close the mobile sidebar whenever the page changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Work out which menu item we're on, for the title in the top bar
  const current = NAV.find((n) =>
    n.end ? pathname === n.to || pathname === n.to + "/" : pathname.startsWith(n.to)
  );

  function handleReset() {
    if (window.confirm("Delete all your tasks, classes, notes and events? This cannot be undone.")) {
      resetAll();
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className={"sidebar" + (open ? " open" : "")}>
        <Link to="/" className="brand">
          <span className="brand-mark">C</span>
          Campus OS
        </Link>

        <div className="nav-label">Workspace</div>
        <nav>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <>
              <div className="item-sub">Signed in as</div>
              <div
                title={user.email}
                style={{
                  fontWeight: 600,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
              <button
                className="btn btn-secondary mt"
                style={{ width: "100%", height: 34 }}
                onClick={handleSignOut}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </>
          )}

          <p className="mt">Your data is saved in this browser only.</p>
          <button
            className="btn btn-ghost"
            onClick={handleReset}
            style={{ height: 34, padding: "0 8px" }}
          >
            <RotateCcw size={15} />
            Reset data
          </button>
        </div>
      </aside>

      {/* Dark overlay behind the mobile sidebar. Tap it to close. */}
      <div className={"backdrop" + (open ? " show" : "")} onClick={() => setOpen(false)} />

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="topbar-title">{current ? current.label : "Campus OS"}</span>
          <span className="grow" />
          <Link to="/" className="btn btn-ghost" style={{ height: 36 }}>
            <Globe size={16} />
            Website
          </Link>
          <button
            className="icon-btn"
            onClick={toggle}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Light theme" : "Dark theme"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="content">
          {/* The current page appears here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}