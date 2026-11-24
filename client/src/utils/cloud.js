import { supabase } from "./supabase.js";
import { todayStr } from "./dates.js";

const TABLES = ["tasks", "classes", "notes", "events"];
const CHUNK = 100; // how many rows to send in one request

// Database row -> the shape the pages use
const fromRow = {
  tasks: (r) => ({ id: r.id, title: r.title, due: r.due || "", done: r.done }),
  classes: (r) => ({ id: r.id, title: r.title, day: r.day, time: r.time || "" }),
  notes: (r) => ({ id: r.id, title: r.title, body: r.body || "", created: r.created }),
  events: (r) => ({ id: r.id, title: r.title, date: r.date, kind: r.kind }),
};

// Page item -> database row. The database fills in id and user_id itself.
const toRow = {
  tasks: (t) => ({ title: t.title, due: t.due || null, done: Boolean(t.done) }),
  classes: (c) => ({ title: c.title, day: c.day, time: c.time || "" }),
  notes: (n) => ({ title: n.title, body: n.body || "", created: n.created || todayStr() }),
  events: (e) => ({ title: e.title, date: e.date, kind: e.kind }),
};

// Throws if the database reported a problem, otherwise returns the data
function must(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

// Splits a long list into groups, so a request never gets too big
function chunks(list) {
  const out = [];
  for (let i = 0; i < list.length; i += CHUNK) out.push(list.slice(i, i + CHUNK));
  return out;
}

// Everything the signed-in user owns
export async function fetchAll() {
  const [t, c, n, e] = await Promise.all([
    supabase.from("tasks").select("*").order("id"),
    supabase.from("classes").select("*").order("id"),
    supabase.from("notes").select("*").order("id", { ascending: false }),
    supabase.from("events").select("*").order("id"),
  ]);
  return {
    tasks: must(t).map(fromRow.tasks),
    classes: must(c).map(fromRow.classes),
    notes: must(n).map(fromRow.notes),
    events: must(e).map(fromRow.events),
  };
}

// Saves one item and returns it with its real id
export async function insertOne(table, item) {
  const rows = must(await supabase.from(table).insert(toRow[table](item)).select());
  return fromRow[table](rows[0]);
}

// Saves many items and returns them with their real ids
export async function insertMany(table, items) {
  const saved = [];
  for (const group of chunks(items)) {
    const rows = must(await supabase.from(table).insert(group.map(toRow[table])).select());
    saved.push(...rows.map(fromRow[table]));
  }
  return saved;
}

// Changes some fields of one item
export async function updateOne(table, id, patch) {
  const fixed = "due" in patch ? { ...patch, due: patch.due || null } : patch;
  must(await supabase.from(table).update(fixed).eq("id", id));
}

export async function deleteOne(table, id) {
  must(await supabase.from(table).delete().eq("id", id));
}

export async function deleteMany(table, ids) {
  for (const group of chunks(ids)) {
    must(await supabase.from(table).delete().in("id", group));
  }
}

// Removes everything the user owns
export async function deleteAll(userId) {
  for (const table of TABLES) {
    must(await supabase.from(table).delete().eq("user_id", userId));
  }
}