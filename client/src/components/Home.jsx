import { todayDay, daysUntil, whenLabel, prettyDate } from "../utils/dates.js";

export default function Home({ tasks, classes, notes, events, goTo }) {
  const pending = tasks.filter((t) => !t.done);
  const overdue = pending.filter((t) => t.due && daysUntil(t.due) < 0).length;

  const day = todayDay();
  const todaysClasses = classes
    .filter((c) => c.day === day)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  // Combine unfinished tasks and future events into one "coming up" list
  const upcoming = [
    ...pending
      .filter((t) => t.due)
      .map((t) => ({ id: "t" + t.id, title: t.title, date: t.due, kind: "Task" })),
    ...events
      .filter((e) => e.date && daysUntil(e.date) >= 0)
      .map((e) => ({ id: "e" + e.id, title: e.title, date: e.date, kind: e.kind })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <>
      <div className="grid">
        <div className="card">
          <h2>Pending tasks</h2>
          <div className="big">{pending.length}</div>
          <span className="muted">
            {overdue > 0 ? (
              <span className="late">{overdue} overdue</span>
            ) : (
              "Nothing overdue"
            )}
            {" · "}
            {notes.length} note{notes.length === 1 ? "" : "s"} saved
          </span>
        </div>

        <div className="card">
          <h2>Today ({day})</h2>
          {todaysClasses.length === 0 ? (
            <span className="muted">
              No classes today. Add your timetable in Classes.
            </span>
          ) : (
            todaysClasses.map((c) => (
              <div className="item" key={c.id}>
                <span className="grow">
                  <b>{c.title}</b>
                </span>
                <small>{c.time}</small>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card spaced">
        <h2>Coming up</h2>
        {upcoming.length === 0 ? (
          <div className="empty">Nothing scheduled yet.</div>
        ) : (
          upcoming.map((u) => {
            const w = whenLabel(u.date);
            return (
              <div className="item" key={u.id}>
                <span className="grow">
                  <b>{u.title}</b>
                  <br />
                  <small>
                    {u.kind} · {prettyDate(u.date)}
                  </small>
                </span>
                <span className={"tag" + (w.late ? " late" : "")}>{w.text}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h2>Need help?</h2>
        <span className="muted">
          Ask the AI assistant about study doubts, assignments or hackathon
          details.
        </span>
        <div className="row spaced">
          <button className="btn" onClick={() => goTo("ai")}>
            Open assistant
          </button>
        </div>
      </div>
    </>
  );
}