import { useState } from "react";
import { Plus, Trash2, CalendarDays, Pencil, Check, X } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { daysUntil, whenLabel, prettyDate } from "../utils/dates.js";
import { KINDS, kindBadge } from "../utils/kinds.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function Calendar() {
  const { events, addEvent, updateEvent, removeEvent } = useData();

  // The add form and the selected filter belong only to this page
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState("Event");
  const [filter, setFilter] = useState("All");

  // Editing: which entry is being edited, and its draft values
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editKind, setEditKind] = useState("Event");

  const canAdd = title.trim() && date;

  function handleAdd() {
    if (!canAdd) return;
    addEvent(title, date, kind);
    setTitle("");
    setDate("");
  }

  function startEdit(e) {
    setEditingId(e.id);
    setEditTitle(e.title);
    setEditDate(e.date);
    setEditKind(e.kind);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (updateEvent(editingId, { title: editTitle, date: editDate, kind: editKind })) {
      setEditingId(null);
    }
  }

  // One row in either list, normal or being edited
  function renderRow(e, past) {
    if (editingId === e.id) {
      return (
        <div className="list-item" key={e.id}>
          <div className="form-row grow">
            <div className="field" style={{ flex: 3 }}>
              <input
                className="input"
                value={editTitle}
                onChange={(ev) => setEditTitle(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") saveEdit();
                  if (ev.key === "Escape") cancelEdit();
                }}
                aria-label="Title"
                autoFocus
              />
            </div>
            <div className="field">
              <input
                className="input"
                type="date"
                value={editDate}
                onChange={(ev) => setEditDate(ev.target.value)}
                aria-label="Date"
              />
            </div>
            <div className="field">
              <select
                className="select"
                value={editKind}
                onChange={(ev) => setEditKind(ev.target.value)}
                aria-label="Type"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={saveEdit}
            disabled={!editTitle.trim() || !editDate}
            aria-label="Save changes"
            title="Save"
          >
            <Check size={16} />
          </button>
          <button className="icon-btn" onClick={cancelEdit} aria-label="Cancel editing" title="Cancel">
            <X size={16} />
          </button>
        </div>
      );
    }

    const w = whenLabel(e.date);
    return (
      <div className="list-item" key={e.id} style={past ? { opacity: 0.6 } : undefined}>
        <div className="grow">
          <div className="item-title">{e.title}</div>
          <div className="item-sub">
            <span className={"badge " + kindBadge(e.kind)}>{e.kind}</span> {prettyDate(e.date)}
          </div>
        </div>

        <span className="badge">{past ? "Past" : w.text}</span>

        <button
          className="icon-btn"
          onClick={() => startEdit(e)}
          aria-label={`Edit "${e.title}"`}
          title="Edit"
        >
          <Pencil size={16} />
        </button>
        <button
          className="icon-btn danger"
          onClick={() => removeEvent(e.id)}
          aria-label={`Delete "${e.title}"`}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
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
              upcoming.map((e) => renderRow(e, false))
            )}
          </div>

          {past.length > 0 && (
            <div className="card mt">
              <div className="card-title">Past ({past.length})</div>
              {past.map((e) => renderRow(e, true))}
            </div>
          )}
        </>
      )}
    </>
  );
}