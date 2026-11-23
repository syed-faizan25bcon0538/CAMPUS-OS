import { useState } from "react";
import { Plus, Trash2, NotebookPen, Search, Pencil } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { prettyDate } from "../utils/dates.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function Notes() {
  const { notes, addNote, updateNote, removeNote } = useData();

  // The write form and the search belong only to this page
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");

  // Editing: which note is being edited, and its draft values
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  function handleSave() {
    if (!title.trim()) return;
    addNote(title, body);
    setTitle("");
    setBody("");
  }

  function startEdit(n) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditBody(n.body || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (updateNote(editingId, { title: editTitle, body: editBody })) {
      setEditingId(null);
    }
  }

  // Search looks in both the title and the text, ignoring capital letters
  const q = query.trim().toLowerCase();
  const shown = notes.filter(
    (n) =>
      !q ||
      n.title.toLowerCase().includes(q) ||
      (n.body || "").toLowerCase().includes(q)
  );

  return (
    <>
      <PageHeader
        title="Notes"
        subtitle={
          notes.length === 0
            ? "Keep lecture notes, ideas and reminders in one place."
            : `${notes.length} ${notes.length === 1 ? "note" : "notes"} saved`
        }
      />

      {/* ----- Write a note ----- */}
      <div className="card">
        <div className="stack">
          <div className="field">
            <label className="label" htmlFor="note-title">
              Title
            </label>
            <input
              id="note-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. OS Unit 2 summary"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="note-body">
              Note
            </label>
            <textarea
              id="note-body"
              className="textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your note here…"
            />
          </div>

          <div>
            <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>
              <Plus size={16} />
              Save note
            </button>
          </div>
        </div>
      </div>

      {/* ----- Search ----- */}
      {notes.length > 0 && (
        <div className="row-wrap mt">
          <div className="search">
            <Search size={16} />
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your notes…"
              aria-label="Search notes"
            />
          </div>
        </div>
      )}

      {/* ----- The notes ----- */}
      <div className="mt">
        {notes.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={NotebookPen}
              title="No notes yet"
              text="Write your first note above. You can search all your notes later."
            />
          </div>
        ) : shown.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Search}
              title="No matching notes"
              text={`Nothing matches "${query}". Try a different word.`}
            />
          </div>
        ) : (
          <div className="notes-grid">
            {shown.map((n) =>
              editingId === n.id ? (
                // ----- A note being edited -----
                <article className="note-card" key={n.id}>
                  <input
                    className="input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
                    aria-label="Note title"
                    autoFocus
                  />
                  <textarea
                    className="textarea"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
                    aria-label="Note text"
                  />
                  <div className="row">
                    <button
                      className="btn btn-primary"
                      onClick={saveEdit}
                      disabled={!editTitle.trim()}
                    >
                      Save
                    </button>
                    <button className="btn btn-ghost" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </article>
              ) : (
                // ----- A normal note card -----
                <article className="note-card" key={n.id}>
                  <div className="row" style={{ alignItems: "flex-start" }}>
                    <h3 className="note-title grow">{n.title}</h3>
                    <button
                      className="icon-btn"
                      style={{ width: 28, height: 28 }}
                      onClick={() => startEdit(n)}
                      aria-label={`Edit note "${n.title}"`}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="icon-btn danger"
                      style={{ width: 28, height: 28 }}
                      onClick={() => removeNote(n.id)}
                      aria-label={`Delete note "${n.title}"`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {n.body && <p className="note-body">{n.body}</p>}

                  {n.created && <div className="item-sub">{prettyDate(n.created)}</div>}
                </article>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}