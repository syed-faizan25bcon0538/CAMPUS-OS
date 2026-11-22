import { useState } from "react";
import { Plus, Trash2, CalendarClock } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { DAYS, todayDay } from "../utils/dates.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function Timetable() {
  const { classes, addClass, removeClass } = useData();

  const today = todayDay();

  // The form fields belong only to this page
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(today);
  const [time, setTime] = useState("");

  function handleAdd() {
    if (!title.trim()) return;
    addClass(title, day, time);
    setTitle("");
    setTime("");
    // The day stays selected, so you can add several classes for one day quickly
  }

  // Classes for one day, earliest first
  const forDay = (d) =>
    classes
      .filter((c) => c.day === d)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle="Your weekly class schedule. Today is highlighted."
      />

      {/* ----- Add a class ----- */}
      <div className="card">
        <div className="form-row">
          <div className="field" style={{ flex: 3 }}>
            <label className="label" htmlFor="class-title">
              Subject
            </label>
            <input
              id="class-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. Data Structures"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="class-day">
              Day
            </label>
            <select
              id="class-day"
              className="select"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="class-time">
              Time
            </label>
            <input
              id="class-time"
              className="input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={handleAdd} disabled={!title.trim()}>
            <Plus size={16} />
            Add class
          </button>
        </div>
      </div>

      {/* ----- The weekly view ----- */}
      <div className="mt">
        {classes.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={CalendarClock}
              title="Your timetable is empty"
              text="Add your classes above and they will appear here, one column per day."
            />
          </div>
        ) : (
          <div className="week-grid">
            {DAYS.map((d) => {
              const list = forDay(d);
              return (
                <div key={d} className={"day-col" + (d === today ? " today" : "")}>
                  <div className="day-head">
                    <span>{d}</span>
                    {d === today ? (
                      <span className="badge badge-accent">Today</span>
                    ) : (
                      <span className="item-sub">
                        {list.length} {list.length === 1 ? "class" : "classes"}
                      </span>
                    )}
                  </div>

                  {list.length === 0 ? (
                    <div className="item-sub">No classes</div>
                  ) : (
                    list.map((c) => (
                      <div className="class-chip" key={c.id}>
                        <div className="grow">
                          <div className="class-name">{c.title}</div>
                          {c.time && <div className="class-time">{c.time}</div>}
                        </div>
                        <button
                          className="icon-btn danger"
                          style={{ width: 28, height: 28 }}
                          onClick={() => removeClass(c.id)}
                          aria-label={`Delete ${c.title} on ${d}`}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}