import { useState } from "react";
import { useStore, clearAll } from "./utils/storage.js";
import Home from "./components/Home.jsx";
import Tasks from "./components/Tasks.jsx";
import Classes from "./components/Classes.jsx";
import Notes from "./components/Notes.jsx";
import Events from "./components/Events.jsx";
import Assistant from "./components/Assistant.jsx";

const TABS = [
  ["home", "Home"],
  ["tasks", "Tasks"],
  ["classes", "Classes"],
  ["notes", "Notes"],
  ["events", "Events & deadlines"],
  ["ai", "AI assistant"],
];

const DEFAULT_EVENTS = [
  { id: 1, title: "Hackathon submission", date: "2026-11-13", kind: "Hackathon" },
];

export default function App() {
  const [tab, setTab] = useState("home");

  // All app data lives here and is saved in the browser automatically
  const [tasks, setTasks] = useStore("cos_tasks", []);
  const [classes, setClasses] = useStore("cos_classes", []);
  const [notes, setNotes] = useStore("cos_notes", []);
  const [events, setEvents] = useStore("cos_events", DEFAULT_EVENTS);

  function handleReset() {
    if (window.confirm("Clear all Campus OS data? This cannot be undone.")) {
      clearAll();
      window.location.reload();
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>
          Campus <span>OS</span>
        </h1>
        <button className="btn-ghost" onClick={handleReset} title="Clear all data">
          Reset
        </button>
      </header>

      <nav className="tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={"tab" + (tab === id ? " active" : "")}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === "home" && (
          <Home
            tasks={tasks}
            classes={classes}
            notes={notes}
            events={events}
            goTo={setTab}
          />
        )}
        {tab === "tasks" && <Tasks tasks={tasks} setTasks={setTasks} />}
        {tab === "classes" && <Classes classes={classes} setClasses={setClasses} />}
        {tab === "notes" && <Notes notes={notes} setNotes={setNotes} />}
        {tab === "events" && <Events events={events} setEvents={setEvents} />}
        {tab === "ai" && (
          <Assistant
            tasks={tasks}
            classes={classes}
            notes={notes}
            events={events}
          />
        )}
      </main>
    </>
  );
}