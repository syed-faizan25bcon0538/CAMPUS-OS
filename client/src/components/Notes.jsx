import { useState } from "react";
import { newId } from "../utils/storage.js";
import { prettyDate, todayStr } from "../utils/dates.js";

export default function Notes({ notes, setNotes }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");

  function addNote() {
    const t = title.trim();
    if (!t) return;
    setNotes([
      { id: newId(), title: t, body: body.trim(), created: todayStr() },
      ...notes,
    ]);
    setTitle("");
    setBody("");
  }

  function remove(id) {
    setNotes(notes.filter((n) => n.id !== id));
  }

  const q = search.trim().toLowerCase();
  const shown = notes.filter(
    (n) =>
      !q ||
      n.title.toLowerCase().includes(q) ||
      (n.body || "").toLowerCase().includes(q)
  );

  return (
    <>
      <div className="card">
        <h2>Add a note</h2>
        <div className="row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title (e.g. OS Unit 2 summary)"
          />
        </div>
        <div className="row spaced">
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your note here…"
          />
        </div>
        <div className="row spaced">
          <button className="btn" onClick={addNote}>
            Save note
          </button>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your notes…"
          />
        </div>

        {notes.length === 0 && <div className="empty spaced">No notes yet.</div>}
        {notes.length > 0 && shown.length === 0 && (
          <div className="empty spaced">No notes match your search.</div>
        )}

        {shown.map((n) => (
          <div className="item" key={n.id}>
            <span className="grow">
              <b>{n.title}</b>
              {n.created && (
                <>
                  <br />
                  <small>{prettyDate(n.created)}</small>
                </>
              )}
              {n.body && (
                <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                  {n.body}
                </div>
              )}
            </span>
            <button
              className="btn-ghost"
              onClick={() => remove(n.id)}
              title="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}