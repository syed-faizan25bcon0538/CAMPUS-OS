import { useState } from "react";
import { Plus, Trash2, ListChecks, CheckCheck, Pencil, Check, X } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { daysUntil, whenLabel, prettyDate } from "../utils/dates.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const FILTERS = ["All", "Pending", "Overdue", "Completed"];

export default function Tasks() {
  const { tasks, addTask, updateTask, toggleTask, removeTask, clearCompleted } = useData();

  // The add form and the selected filter belong only to this page
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("All");

  // Editing: which task is being edited, and its draft values
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");

  function handleAdd() {
    if (!title.trim()) return;
    addTask(title, due);
    setTitle("");
    setDue("");
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDue(t.due || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (updateTask(editingId, { title: editTitle, due: editDue })) {
      setEditingId(null);
    }
  }

  // Which tasks belong to each filter
  const isOverdue = (t) => !t.done && t.due && daysUntil(t.due) < 0;
  const matches = {
    All: () => true,
    Pending: (t) => !t.done,
    Overdue: isOverdue,
    Completed: (t) => t.done,
  };

  // Unfinished first, then by due date (tasks without a date go last)
  const visible = tasks
    .filter(matches[filter])
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        (a.due || "9999").localeCompare(b.due || "9999")
    );

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Assignments, projects and everything else you need to get done."
      >
        {doneCount > 0 && (
          <button className="btn btn-secondary" onClick={clearCompleted}>
            <CheckCheck size={16} />
            Clear completed ({doneCount})
          </button>
        )}
      </PageHeader>

      {/* ----- Add a task ----- */}
      <div className="card">
        <div className="form-row">
          <div className="field" style={{ flex: 3 }}>
            <label className="label" htmlFor="task-title">
              New task
            </label>
            <input
              id="task-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. Finish DBMS assignment"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="task-due">
              Due date (optional)
            </label>
            <input
              id="task-due"
              className="input"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={handleAdd} disabled={!title.trim()}>
            <Plus size={16} />
            Add task
          </button>
        </div>
      </div>

      {/* ----- Filters ----- */}
      <div className="pills mt">
        {FILTERS.map((f) => {
          const count = tasks.filter(matches[f]).length;
          return (
            <button
              key={f}
              className={"pill" + (filter === f ? " active" : "")}
              onClick={() => setFilter(f)}
            >
              {f} ({count})
            </button>
          );
        })}
      </div>

      {/* ----- The list ----- */}
      <div className="card mt">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No tasks yet"
            text="Add your first task above. Give it a due date and it will show up on your dashboard."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={`No ${filter.toLowerCase()} tasks`}
            text="Try a different filter."
          />
        ) : (
          visible.map((t) => {
            // ----- A task being edited -----
            if (editingId === t.id) {
              return (
                <div className="list-item" key={t.id}>
                  <div className="form-row grow">
                    <div className="field" style={{ flex: 3 }}>
                      <input
                        className="input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        aria-label="Task title"
                        autoFocus
                      />
                    </div>
                    <div className="field">
                      <input
                        className="input"
                        type="date"
                        value={editDue}
                        onChange={(e) => setEditDue(e.target.value)}
                        aria-label="Due date"
                      />
                    </div>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={saveEdit}
                    disabled={!editTitle.trim()}
                    aria-label="Save changes"
                    title="Save"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={cancelEdit}
                    aria-label="Cancel editing"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            }

            // ----- A normal task row -----
            const w = t.done ? { text: "", late: false } : whenLabel(t.due);
            return (
              <div className={"list-item" + (t.done ? " done" : "")} key={t.id}>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTask(t.id)}
                  aria-label={`Mark "${t.title}" as ${t.done ? "not done" : "done"}`}
                />

                <div className="grow">
                  <div className="item-title">{t.title}</div>
                  <div className="item-sub">{t.due ? prettyDate(t.due) : "No due date"}</div>
                </div>

                {t.done ? (
                  <span className="badge badge-green">Done</span>
                ) : (
                  w.text && (
                    <span className={"badge " + (w.late ? "badge-red" : "")}>{w.text}</span>
                  )
                )}

                <button
                  className="icon-btn"
                  onClick={() => startEdit(t)}
                  aria-label={`Edit "${t.title}"`}
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => removeTask(t.id)}
                  aria-label={`Delete "${t.title}"`}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}