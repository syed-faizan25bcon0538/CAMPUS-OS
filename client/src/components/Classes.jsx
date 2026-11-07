import { useState } from "react";
import { newId } from "../utils/storage.js";
import { DAYS, todayDay } from "../utils/dates.js";

export default function Classes({ classes, setClasses }) {
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(todayDay());
  const [time, setTime] = useState("");

  function addClass() {
    const t = title.trim();
    if (!t) return;
    setClasses([...classes, { id: newId(), title: t, day, time }]);
    setTitle("");
    setTime("");
  }

  function remove(id) {
    setClasses(classes.filter((c) => c.id !== id));
  }

  const today = todayDay();

  return (
    <>
      <div className="card">
        <h2>Add a class</h2>
        <div className="row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addClass()}
            placeholder="Subject (e.g. Data Structures)"
          />
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <button className="btn" onClick={addClass}>
            Add
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Weekly timetable</h2>
        {classes.length === 0 && <div className="empty">No classes yet.</div>}
        {DAYS.map((d) => {
          const list = classes
            .filter((c) => c.day === d)
            .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          if (list.length === 0) return null;
          return (
            <div key={d} className="spaced">
              <b>{d}</b>
              {d === today && <span className="tag"> Today</span>}
              {list.map((c) => (
                <div className="item" key={c.id}>
                  <span className="grow">
                    <b>{c.title}</b>
                  </span>
                  <small>{c.time}</small>
                  <button
                    className="btn-ghost"
                    onClick={() => remove(c.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}