import { createContext, useContext, useMemo } from "react";
import { useStore, newId, clearAll } from "../utils/storage.js";
import { todayStr } from "../utils/dates.js";

// A "context" is a shared box of data. Any page can open it with useData()
// instead of receiving the data through props from its parent.
const DataContext = createContext(null);

export function DataProvider({ children }) {
  // Same storage keys as the old version, so saved data carries over
  const [tasks, setTasks] = useStore("cos_tasks", []);
  const [classes, setClasses] = useStore("cos_classes", []);
  const [notes, setNotes] = useStore("cos_notes", []);
  const [events, setEvents] = useStore("cos_events", []);

  const value = useMemo(
    () => ({
      // ----- the data -----
      tasks,
      classes,
      notes,
      events,

      // ----- tasks -----
      addTask(title, due) {
        const t = title.trim();
        if (!t) return;
        setTasks((prev) => [
          ...prev,
          { id: newId(), title: t, due: due || "", done: false },
        ]);
      },
      toggleTask(id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
        );
      },
      removeTask(id) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      },
      clearCompleted() {
        setTasks((prev) => prev.filter((t) => !t.done));
      },

      // ----- timetable -----
      addClass(title, day, time) {
        const t = title.trim();
        if (!t) return;
        setClasses((prev) => [...prev, { id: newId(), title: t, day, time: time || "" }]);
      },
      removeClass(id) {
        setClasses((prev) => prev.filter((c) => c.id !== id));
      },

      // ----- notes -----
      addNote(title, body) {
        const t = title.trim();
        if (!t) return;
        setNotes((prev) => [
          { id: newId(), title: t, body: body.trim(), created: todayStr() },
          ...prev,
        ]);
      },
      removeNote(id) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      },

      // ----- events and deadlines -----
      addEvent(title, date, kind) {
        const t = title.trim();
        if (!t || !date) return;
        setEvents((prev) => [...prev, { id: newId(), title: t, date, kind }]);
      },
      removeEvent(id) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      },

      // ----- everything -----
      resetAll() {
        clearAll();
        setTasks([]);
        setClasses([]);
        setNotes([]);
        setEvents([]);
      },
    }),
    [tasks, classes, notes, events, setTasks, setClasses, setNotes, setEvents]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// The hook every page uses:  const { tasks, addTask } = useData();
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}