import { useState } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { daysUntil, whenLabel, prettyDate } from "../utils/dates.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const KINDS = ["Event", "Deadline", "Exam", "Hackathon"];

// Picks a badge colour for each kind
function kindBadge(kind) {
  switch (kind) {
    case "Deadline":
      return "badge-red";
    case "Exam":
      return "badge-amber";
    case "Hackathon":
      return "badge-blue";
    default:
      return "badge-accent";
  }
}

// One row in either list
function EventRow({ event, past, onRemove }) {
  const w = whenLabel(event.date);
  return (
    <div className="list-item" style={past ? { opacity: 0.6 } : undefined}>
      <div className="grow">
        <div className="item-title">{event.title}</div>
        <div className="item-sub">
          <span className={"badge " + kindBadge(event.kind)}>{event.kind}</span>{" "}
          {prettyDate(event.date)}
        </div>
      </div>

      <span className="badge">{past ? "Past" : w.text}</span>

      <button
        className="icon-btn danger"
        onClick={() => onRemove(event.id)}
        aria-label={`Delete "${event.title}"`}
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function Calendar() {
  const { events, addEvent, removeEvent } = useData();

  // These belong only to this page
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState("Event");
  const [filter, setFilter] = useState("All");

  const canAdd = title.trim() && date;

  function handleAdd() {
    if (!canAdd) return;
    addEvent(title, date, kind);
    setTitle("");
    setDate("");
  }

  // Apply the filter, then split into upcoming and past
  const filtered = events.filter((e) => filter === "All" || e.kind === filter);

  const upcoming = filtered
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date)); // soonest first

  const past = filtered
    .filter((e) => daysUntil(e.date) < 0)
    .sort((a, b) => b.date.localeCompare(a.date)); // most recent first

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Exams, deadlines, hackathons and events, with a countdown for each."
      />

      {/* ----- Add an event ----- */}
      <div className="card">
        <div className="form-row">
          <div className="field" style={{ flex: 3 }}>
            <label className="label" htmlFor="ev-title">
              Title
            </label>
            <input
              id="ev-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. Mid-semester exam"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="ev-date">
              Date
            </label>
            <input
              id="ev-date"
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="ev-kind">
              Type
            </label>
            <select
              id="ev-kind"
              className="select"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleAdd} disabled={!canAdd}>
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* ----- Filter by type ----- */}
      {events.length > 0 && (
        <div className="pills mt">
          {["All", ...KINDS].map((k) => (
            <button
              key={k}
              className={"pill" + (filter === k ? " active" : "")}
              onClick={() => setFilter(k)}
            >
              {k}
            </button>
          ))}
        </div>
      )}

      {/* ----- The lists ----- */}
      {events.length === 0 ? (
        <div className="card mt">
          <EmptyState
            icon={CalendarDays}
            title="Nothing on your calendar"
            text="Add an exam, deadline or event above. Upcoming ones also appear on your dashboard."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt">
          <EmptyState
            icon={CalendarDays}
            title={`No ${filter.toLowerCase()} entries`}
            text="Try a different type."
          />
        </div>
      ) : (
        <>
          <div className="card mt">
            <div className="card-title">Upcoming ({upcoming.length})</div>
            {upcoming.length === 0 ? (
              <div className="item-sub">Nothing coming up.</div>
            ) : (
              upcoming.map((e) => <EventRow key={e.id} event={e} onRemove={removeEvent} />)
            )}
          </div>

          {past.length > 0 && (
            <div className="card mt">
              <div className="card-title">Past ({past.length})</div>
              {past.map((e) => (
                <EventRow key={e.id} event={e} past onRemove={removeEvent} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}