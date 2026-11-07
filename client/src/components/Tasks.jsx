import { useState } from "react";
import { newId } from "../utils/storage.js";
import { whenLabel, prettyDate } from "../utils/dates.js";

export default function Tasks({ tasks, setTasks }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  function addTask() {
    const t = title.trim();
    if (!t) return;
    setTasks([...tasks, { id: newId(), title: t, due, done: false }]);
    setTitle("");
    setDue("");
  }

  function toggle(id) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id) {
    setTasks(tasks.filter((t) => t.id !== id));
  }

  // Unfinished first, then by due date (tasks without a date go last)
  const sorted = [...tasks].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      (a.due || "9999").localeCompare(b.due || "9999")
  );

  return (
    <>
      <div className="card">
        <h2>Add a task</h2>
        <div className="row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Task (e.g. DBMS assignment)"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <button className="btn" onClick={addTask}>
            Add
          </button>
        </div>
      </div>

      <div className="card">
        {sorted.length === 0 && <div className="empty">No tasks yet.</div>}
        {sorted.map((t) => {
          const w = t.done ? { text: "", late: false } : whenLabel(t.due);
          return (
            <div className={"item" + (t.done ? " done" : "")} key={t.id}>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
              />
              <span className="grow">
                <b>{t.title}</b>
                <br />
                <small>
                  {t.due ? prettyDate(t.due) : "No date"}
                  {w.text && (
                    <>
                      {" · "}
                      <span className={w.late ? "late" : ""}>{w.text}</span>
                    </>
                  )}
                </small>
              </span>
              <button
                className="btn-ghost"
                onClick={() => remove(t.id)}
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