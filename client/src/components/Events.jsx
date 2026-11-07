import { useState } from "react";
import { newId } from "../utils/storage.js";
import { whenLabel, prettyDate, daysUntil } from "../utils/dates.js";

const KINDS = ["Event", "Deadline", "Hackathon", "Exam"];

export default function Events({ events, setEvents }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState("Event");

  function addEvent() {
    const t = title.trim();
    if (!t || !date) return;
    setEvents([...events, { id: newId(), title: t, date, kind }]);
    setTitle("");
    setDate("");
    setKind("Event");
  }

  function remove(id) {
    setEvents(events.filter((e) => e.id !== id));
  }

  // Upcoming first (soonest at the top), past events at the bottom
  const sorted = [...events].sort((a, b) => {
    const pastA = daysUntil(a.date) < 0;
    const pastB = daysUntil(b.date) < 0;
    if (pastA !== pastB) return pastA ? 1 : -1;
    return a.date.localeCompare(b.date);
  });

  return (
    <>
      <div className="card">
        <h2>Add an event or deadline</h2>
        <div className="row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEvent()}
            placeholder="Title (e.g. Mid-sem exam)"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button className="btn" onClick={addEvent}>
            Add
          </button>
        </div>
        <small className="muted">A date is required for events and deadlines.</small>
      </div>

      <div className="card">
        {sorted.length === 0 && (
          <div className="empty">No events or deadlines yet.</div>
        )}
        {sorted.map((e) => {
          const w = whenLabel(e.date);
          const past = daysUntil(e.date) < 0;
          return (
            <div className="item" key={e.id} style={past ? { opacity: 0.6 } : undefined}>
              <span className="grow">
                <b>{e.title}</b>
                <br />
                <small>
                  {e.kind} · {prettyDate(e.date)}
                </small>
              </span>
              <span className="tag">{past ? "Past" : w.text}</span>
              <button
                className="btn-ghost"
                onClick={() => remove(e.id)}
                title="Delete"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}