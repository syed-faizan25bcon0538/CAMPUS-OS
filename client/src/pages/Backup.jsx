import { useRef, useState } from "react";
import { Download, Upload, HardDriveDownload } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { parseBackup } from "../utils/backup.js";
import { todayStr } from "../utils/dates.js";
import PageHeader from "../components/ui/PageHeader.jsx";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB is far more than any real backup
const KINDS = ["Event", "Deadline", "Exam", "Hackathon"];
const DATE_OK = /^\d{4}-\d{2}-\d{2}$/;

// Starts a download of a JSON file in the browser
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Reads one old localStorage list; returns [] if missing or broken
function readList(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Reads the old browser-only data and cleans it into the shapes the app uses
function readOldData() {
  const tasks = readList("cos_tasks")
    .map((t) => ({
      title: str(t?.title, 200),
      due: DATE_OK.test(t?.due) ? t.due : "",
      done: Boolean(t?.done),
    }))
    .filter((t) => t.title);

  const classes = readList("cos_classes")
    .map((c) => ({ title: str(c?.title, 200), day: str(c?.day, 20), time: str(c?.time, 20) }))
    .filter((c) => c.title && c.day);

  const notes = readList("cos_notes")
    .map((n) => ({
      title: str(n?.title, 200),
      body: str(n?.body, 20000),
      created: DATE_OK.test(n?.created) ? n.created : todayStr(),
    }))
    .filter((n) => n.title);

  const events = readList("cos_events")
    .map((e) => ({
      title: str(e?.title, 200),
      date: DATE_OK.test(e?.date) ? e.date : "",
      kind: KINDS.includes(e?.kind) ? e.kind : "Event",
    }))
    .filter((e) => e.title && e.date);

  return { tasks, classes, notes, events };
}

const countAll = (d) => d.tasks.length + d.classes.length + d.notes.length + d.events.length;

export default function Backup() {
  const { tasks, classes, notes, events, exportData, importData } = useData();

  const fileRef = useRef(null);
  const [pending, setPending] = useState(null); // a checked file waiting for your choice
  const [mode, setMode] = useState("merge");
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }
  const [old, setOld] = useState(readOldData); // data from before accounts existed

  function handleExport() {
    downloadJson(exportData(), `campus-os-backup-${todayStr()}.json`);
    setMessage({ type: "ok", text: "Backup downloaded. Keep the file somewhere safe." });
  }

  function handleOldImport() {
    if (!old || countAll(old) === 0) return;
    const added = importData(old, "merge");
    setOld(null);
    setMessage({
      type: "ok",
      text: `Moved your old browser data into your account: ${plural(added.tasks, "task")}, ${plural(added.classes, "class")}, ${plural(added.notes, "note")} and ${plural(added.events, "event")}.`,
    });
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets you pick the same file again later
    if (!file) return;
    setMessage(null);
    setPending(null);

    if (file.size > MAX_FILE_BYTES) {
      setMessage({ type: "error", text: "That file is too large to be a Campus OS backup." });
      return;
    }

    try {
      const clean = parseBackup(await file.text());
      setPending({ name: file.name, clean });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  function handleImport() {
    if (!pending) return;
    if (
      mode === "replace" &&
      !window.confirm("Replace ALL your current data with this backup? This cannot be undone.")
    ) {
      return;
    }
    const added = importData(pending.clean, mode);
    setPending(null);
    setMessage({
      type: "ok",
      text:
        mode === "replace"
          ? `Replaced your data with the backup: ${plural(added.tasks, "task")}, ${plural(added.classes, "class")}, ${plural(added.notes, "note")}, ${plural(added.events, "event")}.`
          : `Added ${plural(added.tasks, "task")}, ${plural(added.classes, "class")}, ${plural(added.notes, "note")} and ${plural(added.events, "event")}. Items you already had were skipped.`,
    });
  }

  const c = pending?.clean;

  return (
    <>
      <PageHeader
        title="Backup"
        subtitle="Your data is saved in your account. Download a copy to keep it safe or move it to another device."
      />

      {message && (
        <div
          role="status"
          className="card"
          style={{
            marginBottom: 16,
            background: message.type === "ok" ? "var(--green-soft)" : "var(--red-soft)",
            color: message.type === "ok" ? "var(--green)" : "var(--red)",
            borderColor: "transparent",
          }}
        >
          {message.text}
        </div>
      )}

      {old && countAll(old) > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Old data found in this browser</div>
          <p className="muted">
            From before accounts existed: {plural(old.tasks.length, "task")},{" "}
            {plural(old.classes.length, "class")}, {plural(old.notes.length, "note")} and{" "}
            {plural(old.events.length, "event")}. Move it into your account. Items you already
            have are skipped.
          </p>
          <div className="mt">
            <button className="btn btn-primary" onClick={handleOldImport}>
              <HardDriveDownload size={16} />
              Import into my account
            </button>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Export</div>
          <p className="muted">
            Download everything as one file: {plural(tasks.length, "task")},{" "}
            {plural(classes.length, "class")}, {plural(notes.length, "note")} and{" "}
            {plural(events.length, "event")}.
          </p>
          <div className="mt">
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={16} />
              Download backup
            </button>
          </div>
          <p className="item-sub mt">
            The file is plain text and includes your notes, so keep it private.
          </p>
        </div>

        <div className="card">
          <div className="card-title">Import</div>
          <p className="muted">
            Choose a backup file you downloaded earlier. You will see what it contains before
            anything changes.
          </p>
          <div className="mt">
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              style={{ display: "none" }}
              aria-label="Choose a backup file"
            />
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} />
              Choose backup file
            </button>
          </div>
        </div>
      </div>

      {pending && (
        <div className="card mt">
          <div className="card-title">Ready to import</div>
          <p className="muted">
            <strong>{pending.name}</strong> contains {plural(c.tasks.length, "task")},{" "}
            {plural(c.classes.length, "class")}, {plural(c.notes.length, "note")} and{" "}
            {plural(c.events.length, "event")}.
          </p>

          <div className="stack mt">
            <label className="row" style={{ alignItems: "flex-start" }}>
              <input
                type="radio"
                name="mode"
                checked={mode === "merge"}
                onChange={() => setMode("merge")}
                style={{ marginTop: 4 }}
              />
              <span>
                <strong>Add to my data</strong>
                <br />
                <span className="item-sub">
                  Keeps what you have and adds only what is missing. Duplicates are skipped.
                </span>
              </span>
            </label>

            <label className="row" style={{ alignItems: "flex-start" }}>
              <input
                type="radio"
                name="mode"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
                style={{ marginTop: 4 }}
              />
              <span>
                <strong>Replace my data</strong>
                <br />
                <span className="item-sub">
                  Deletes everything you have now and uses the backup instead.
                </span>
              </span>
            </label>
          </div>

          <div className="row-wrap mt">
            <button className="btn btn-primary" onClick={handleImport}>
              Import
            </button>
            <button className="btn btn-ghost" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}