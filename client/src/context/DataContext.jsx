import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import * as cloud from "../utils/cloud.js";
import { buildBackup } from "../utils/backup.js";
import { todayStr } from "../utils/dates.js";
import DataStatus from "../components/ui/DataStatus.jsx";

// A "context" is a shared box of data. Any page opens it with useData().
const DataContext = createContext(null);

// The items in `incoming` that are not already in `existing`
function newItems(existing, incoming, keyOf) {
  const seen = new Set(existing.map(keyOf));
  const fresh = [];
  for (const item of incoming) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push(item);
  }
  return fresh;
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [tasks, setTasks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pending = useRef(0); // how many saves are in flight right now
  const loadId = useRef(0); // lets us ignore answers from older loads

  // Fetch everything this user owns
  const reload = useCallback(async () => {
    if (!userId) return;
    const mine = ++loadId.current;
    try {
      const data = await cloud.fetchAll();
      if (mine !== loadId.current) return; // a newer load has started
      setTasks(data.tasks);
      setClasses(data.classes);
      setNotes(data.notes);
      setEvents(data.events);
      setError("");
    } catch (err) {
      console.error("Load failed:", err);
      if (mine === loadId.current) {
        setError("Couldn't load your data. Check your connection and try again.");
      }
    } finally {
      if (mine === loadId.current) setLoading(false);
    }
  }, [userId]);

  // Load when someone signs in; clear everything when they sign out or switch accounts
  useEffect(() => {
    loadId.current += 1;
    if (!userId) {
      setTasks([]);
      setClasses([]);
      setNotes([]);
      setEvents([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    reload();
  }, [userId, reload]);

  // Refresh when you come back to this tab, so changes from other devices show up
  useEffect(() => {
    if (!userId) return;
    const onVisible = () => {
      if (document.visibilityState === "visible" && pending.current === 0) reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [userId, reload]);

  // Runs a save in the background. On failure: show a message, and optionally reload the truth.
  const run = useCallback(
    async (job, message, resync = false) => {
      pending.current += 1;
      try {
        await job();
      } catch (err) {
        console.error("Save failed:", err);
        setError(message);
        if (resync) reload();
      } finally {
        pending.current -= 1;
      }
    },
    [reload]
  );

  const value = useMemo(
    () => ({
      tasks,
      classes,
      notes,
      events,
      loading,
      error,
      reload,

      // ----- tasks -----
      addTask(title, due) {
        const t = title.trim();
        if (!t) return;
        run(async () => {
          const row = await cloud.insertOne("tasks", { title: t, due: due || "", done: false });
          setTasks((prev) => [...prev, row]);
        }, "Couldn't save that task. Please try again.");
      },
      updateTask(id, { title, due }) {
        const t = title.trim();
        if (!t) return false;
        setTasks((prev) =>
          prev.map((x) => (x.id === id ? { ...x, title: t, due: due || "" } : x))
        );
        run(
          () => cloud.updateOne("tasks", id, { title: t, due: due || "" }),
          "Couldn't save your changes.",
          true
        );
        return true;
      },
      toggleTask(id) {
        const current = tasks.find((t) => t.id === id);
        if (!current) return;
        const done = !current.done;
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
        run(() => cloud.updateOne("tasks", id, { done }), "Couldn't update that task.", true);
      },
      removeTask(id) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        run(() => cloud.deleteOne("tasks", id), "Couldn't delete that task.", true);
      },
      clearCompleted() {
        const ids = tasks.filter((t) => t.done).map((t) => t.id);
        if (ids.length === 0) return;
        setTasks((prev) => prev.filter((t) => !t.done));
        run(() => cloud.deleteMany("tasks", ids), "Couldn't clear the completed tasks.", true);
      },

      // ----- timetable (a class can be added to several days at once) -----
      addClass(title, days, time) {
        const t = title.trim();
        const list = Array.isArray(days) ? days : [days];
        if (!t || list.length === 0) return;
        run(async () => {
          const rows = await cloud.insertMany(
            "classes",
            list.map((day) => ({ title: t, day, time: time || "" }))
          );
          setClasses((prev) => [...prev, ...rows]);
        }, "Couldn't save that class. Please try again.");
      },
      removeClass(id) {
        setClasses((prev) => prev.filter((c) => c.id !== id));
        run(() => cloud.deleteOne("classes", id), "Couldn't delete that class.", true);
      },

      // ----- notes -----
      addNote(title, body) {
        const t = title.trim();
        if (!t) return;
        run(async () => {
          const row = await cloud.insertOne("notes", {
            title: t,
            body: body.trim(),
            created: todayStr(),
          });
          setNotes((prev) => [row, ...prev]);
        }, "Couldn't save that note. Please try again.");
      },
      updateNote(id, { title, body }) {
        const t = title.trim();
        if (!t) return false;
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, title: t, body: body.trim() } : n))
        );
        run(
          () => cloud.updateOne("notes", id, { title: t, body: body.trim() }),
          "Couldn't save your changes.",
          true
        );
        return true;
      },
      removeNote(id) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        run(() => cloud.deleteOne("notes", id), "Couldn't delete that note.", true);
      },

      // ----- events and deadlines -----
      addEvent(title, date, kind) {
        const t = title.trim();
        if (!t || !date) return;
        run(async () => {
          const row = await cloud.insertOne("events", { title: t, date, kind });
          setEvents((prev) => [...prev, row]);
        }, "Couldn't save that entry. Please try again.");
      },
      updateEvent(id, { title, date, kind }) {
        const t = title.trim();
        if (!t || !date) return false;
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, title: t, date, kind } : e)));
        run(
          () => cloud.updateOne("events", id, { title: t, date, kind }),
          "Couldn't save your changes.",
          true
        );
        return true;
      },
      removeEvent(id) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        run(() => cloud.deleteOne("events", id), "Couldn't delete that entry.", true);
      },

      // ----- backup -----
      exportData() {
        return buildBackup({ tasks, classes, notes, events });
      },
      // mode "replace" swaps everything; "merge" adds what is missing.
      // Returns how many items of each kind will be added.
      importData(clean, mode) {
        const keys = {
          tasks: (x) => `${x.title}|${x.due}`,
          classes: (x) => `${x.title}|${x.day}|${x.time}`,
          notes: (x) => `${x.title}|${x.body}`,
          events: (x) => `${x.title}|${x.date}|${x.kind}`,
        };
        const current = { tasks, classes, notes, events };
        const names = Object.keys(keys);

        const plan = {};
        for (const name of names) {
          plan[name] =
            mode === "replace" ? clean[name] : newItems(current[name], clean[name], keys[name]);
        }
        const counts = {
          tasks: plan.tasks.length,
          classes: plan.classes.length,
          notes: plan.notes.length,
          events: plan.events.length,
        };

        // For "replace": remember the old rows, and delete them only after the new ones are saved
        const oldIds =
          mode === "replace"
            ? {
                tasks: tasks.map((x) => x.id),
                classes: classes.map((x) => x.id),
                notes: notes.map((x) => x.id),
                events: events.map((x) => x.id),
              }
            : null;

        run(
          async () => {
            for (const name of names) await cloud.insertMany(name, plan[name]);
            if (oldIds) for (const name of names) await cloud.deleteMany(name, oldIds[name]);
            await reload();
          },
          "Couldn't finish the import. Please try again.",
          true
        );

        return counts;
      },

      // ----- everything -----
      resetAll() {
        if (!userId) return;
        setTasks([]);
        setClasses([]);
        setNotes([]);
        setEvents([]);
        run(() => cloud.deleteAll(userId), "Couldn't delete your data. Please try again.", true);
      },
    }),
    [tasks, classes, notes, events, loading, error, userId, run, reload]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
      <DataStatus loading={loading} error={error} onDismiss={() => setError("")} />
    </DataContext.Provider>
  );
}

// The hook every page uses:  const { tasks, addTask } = useData();
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}