import { DAYS, todayStr } from "./dates.js";
import { KINDS } from "./kinds.js";
import { newId } from "./storage.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const MAX_ITEMS = 2000;

const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v) => (Array.isArray(v) ? v.slice(0, MAX_ITEMS) : []);

// The data that goes into the backup file
export function buildBackup({ tasks, classes, notes, events }) {
  return {
    app: "campus-os",
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    classes,
    notes,
    events,
  };
}

// Turns the text of a backup file into clean data.
// Throws an Error with a friendly message if it is not a valid backup.
export function parseBackup(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("That file could not be read. Is it a Campus OS backup?");
  }
  if (!data || typeof data !== "object" || data.app !== "campus-os") {
    throw new Error("That file is not a Campus OS backup.");
  }

  const used = new Set();
  const idOf = (item) => {
    let id = Number(item?.id);
    while (!Number.isFinite(id) || used.has(id)) id = newId();
    used.add(id);
    return id;
  };

  const tasks = list(data.tasks)
    .map((t) => ({
      id: idOf(t),
      title: text(t?.title, 200),
      due: DATE_RE.test(t?.due) ? t.due : "",
      done: t?.done === true,
    }))
    .filter((t) => t.title);

  const classes = list(data.classes)
    .map((c) => ({
      id: idOf(c),
      title: text(c?.title, 200),
      day: DAYS.includes(c?.day) ? c.day : "",
      time: TIME_RE.test(c?.time) ? c.time : "",
    }))
    .filter((c) => c.title && c.day);

  const notes = list(data.notes)
    .map((n) => ({
      id: idOf(n),
      title: text(n?.title, 200),
      body: text(n?.body, 5000),
      created: DATE_RE.test(n?.created) ? n.created : todayStr(),
    }))
    .filter((n) => n.title);

  const events = list(data.events)
    .map((e) => ({
      id: idOf(e),
      title: text(e?.title, 200),
      date: DATE_RE.test(e?.date) ? e.date : "",
      kind: KINDS.includes(e?.kind) ? e.kind : "Event",
    }))
    .filter((e) => e.title && e.date);

  return { tasks, classes, notes, events };
}