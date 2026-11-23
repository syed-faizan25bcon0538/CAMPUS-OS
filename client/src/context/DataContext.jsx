import { createContext, useContext, useMemo } from "react";
import { useStore, newId, clearAll } from "../utils/storage.js";
import { todayStr } from "../utils/dates.js";
import { buildBackup } from "../utils/backup.js";

// A "context" is a shared box of data. Any page opens it with useData().
const DataContext = createContext(null);

// Adds incoming items to a list, skipping ones that already exist, with fresh ids
function mergeList(prev, incoming, keyOf) {
  const seen = new Set(prev.map(keyOf));
  const base = newId();
  const fresh = [];
  for (const item of incoming) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push({ ...item, id: base + fresh.length });
  }
  return { list: [...prev, ...fresh], added: fresh.length };
}

export function DataProvider({ children }) {
  // Same storage keys as before, so saved data carries over
  const [tasks, setTasks] = useStore("cos_tasks", []);
  const [classes, setClasses] = useStore("cos_classes", []);
  const [notes, setNotes] = useStore("cos_notes", []);
  const [events, setEvents] = useStore("cos_events", []);

  const value = useMemo(
    () => ({
      tasks,
      classes,
      notes,
      events,

      // ----- tasks -----
      addTask(title, due) {
        const t = title.trim();
        if (!t) return;
        setTasks((prev) => [...prev, { id: newId(), title: t, due: due || "", done: false }]);
      },
      updateTask(id, { title, due }) {
        const t = title.trim();
        if (!t) return false;
        setTasks((prev) =>
          prev.map((x) => (x.id === id ? { ...x, title: t, due: due || "" } : x))
        );
        return true;
      },
      toggleTask(id) {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      },
      removeTask(id) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      },
      clearCompleted() {
        setTasks((prev) => prev.filter((t) => !t.done));
      },

      // ----- timetable (a class can be added to several days at once) -----
      addClass(title, days, time) {
        const t = title.trim();
        const list = Array.isArray(days) ? days : [days];
        if (!t || list.length === 0) return;
        const base = newId();
        setClasses((prev) => [
          ...prev,
          ...list.map((day, i) => ({ id: base + i, title: t, day, time: time || "" })),
        ]);
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
      updateNote(id, { title, body }) {
        const t = title.trim();
        if (!t) return false;
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, title: t, body: body.trim() } : n))
        );
        return true;
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
      updateEvent(id, { title, date, kind }) {
        const t = title.trim();
        if (!t || !date) return false;
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, title: t, date, kind } : e)));
        return true;
      },
      removeEvent(id) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      },

      // ----- backup -----
      exportData() {
        return buildBackup({ tasks, classes, notes, events });
      },
      // mode "replace" swaps everything; "merge" adds what is missing.
      // Returns how many items of each kind were added.
      importData(clean, mode) {
        if (mode === "replace") {
          setTasks(clean.tasks);
          setClasses(clean.classes);
          setNotes(clean.notes);
          setEvents(clean.events);
          return {
            tasks: clean.tasks.length,
            classes: clean.classes.length,
            notes: clean.notes.length,
            events: clean.events.length,
          };
        }
        const t = mergeList(tasks, clean.tasks, (x) => `${x.title}|${x.due}`);
        const c = mergeList(classes, clean.classes, (x) => `${x.title}|${x.day}|${x.time}`);
        const n = mergeList(notes, clean.notes, (x) => `${x.title}|${x.body}`);
        const e = mergeList(events, clean.events, (x) => `${x.title}|${x.date}|${x.kind}`);
        setTasks(t.list);
        setClasses(c.list);
        setNotes(n.list);
        setEvents(e.list);
        return { tasks: t.added, classes: c.added, notes: n.added, events: e.added };
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