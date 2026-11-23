import { Link } from "react-router-dom";
import {
  ListChecks,
  Clock,
  Flag,
  CalendarClock,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { todayDay, daysUntil, whenLabel, prettyDate } from "../utils/dates.js";
import { kindBadge } from "../utils/kinds.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// One number card at the top of the page
function Stat({ icon: Icon, tone, value, label }) {
  return (
    <div className="stat-card">
      <div className={"stat-icon " + tone}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { tasks, classes, events } = useData();

  // ----- numbers for the stat cards -----
  const pending = tasks.filter((t) => !t.done);
  const overdue = pending.filter((t) => t.due && daysUntil(t.due) < 0);
  const dueSoon = pending.filter((t) => {
    const d = daysUntil(t.due);
    return d !== null && d >= 0 && d <= 7;
  });

  // ----- today's classes, earliest first -----
  const day = todayDay();
  const todaysClasses = classes
    .filter((c) => c.day === day)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  // ----- tasks and events merged into one "coming up" list -----
  const upcoming = [
    ...pending
      .filter((t) => t.due)
      .map((t) => ({
        id: "t" + t.id,
        title: t.title,
        date: t.due,
        kind: "Task",
        to: "/app/tasks",
      })),
    ...events
      .filter((e) => daysUntil(e.date) >= 0)
      .map((e) => ({
        id: "e" + e.id,
        title: e.title,
        date: e.date,
        kind: e.kind,
        to: "/app/calendar",
      })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const dateText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader title={greeting()} subtitle={dateText} />

      <div className="stats">
        <Stat icon={ListChecks} tone="" value={pending.length} label="Pending tasks" />
        <Stat icon={Clock} tone="amber" value={dueSoon.length} label="Due in 7 days" />
        <Stat icon={Flag} tone="red" value={overdue.length} label="Overdue" />
        <Stat
          icon={CalendarClock}
          tone="green"
          value={todaysClasses.length}
          label={`Classes today (${day})`}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">
            Today's classes
            <Link to="/app/timetable" className="btn btn-ghost" style={{ height: 30, padding: "0 8px" }}>
              Timetable <ArrowRight size={14} />
            </Link>
          </div>

          {todaysClasses.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No classes today"
              text="Add your weekly timetable to see today's classes here."
            />
          ) : (
            todaysClasses.map((c) => (
              <div className="list-item" key={c.id}>
                <div className="grow">
                  <div className="item-title">{c.title}</div>
                </div>
                {c.time && <span className="badge">{c.time}</span>}
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">
            Coming up
            <Link to="/app/calendar" className="btn btn-ghost" style={{ height: 30, padding: "0 8px" }}>
              Calendar <ArrowRight size={14} />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing scheduled"
              text="Tasks with due dates and upcoming events will show up here."
            />
          ) : (
            upcoming.map((u) => {
              const w = whenLabel(u.date);
              return (
                <Link to={u.to} className="list-item" key={u.id}>
                  <div className="grow">
                    <div className="item-title">{u.title}</div>
                    <div className="item-sub">
                      <span className={"badge " + kindBadge(u.kind)}>{u.kind}</span>{" "}
                      {prettyDate(u.date)}
                    </div>
                  </div>
                  <span className={"badge " + (w.late ? "badge-red" : "")}>{w.text}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="card mt">
        <div className="card-title">Quick actions</div>
        <div className="row-wrap">
          <Link to="/app/tasks" className="btn btn-secondary">
            Add a task
          </Link>
          <Link to="/app/timetable" className="btn btn-secondary">
            Add a class
          </Link>
          <Link to="/app/notes" className="btn btn-secondary">
            Write a note
          </Link>
          <Link to="/app/calendar" className="btn btn-secondary">
            Add a deadline
          </Link>
          <Link to="/app/assistant" className="btn btn-primary">
            Ask the AI assistant
          </Link>
        </div>
      </div>
    </>
  );
}