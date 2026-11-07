export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(n) {
  return String(n).padStart(2, "0");
}

// Today's date as "YYYY-MM-DD" in your local time
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Today's weekday as "Mon", "Tue", ... (matches the DAYS list)
export function todayDay() {
  return DAYS[(new Date().getDay() + 6) % 7];
}

// Number of days from today until the given "YYYY-MM-DD" date.
// Negative means the date has passed. Returns null if there is no date.
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

// A friendly label such as "in 3 days", "tomorrow" or "2 days overdue"
export function whenLabel(dateStr) {
  const n = daysUntil(dateStr);
  if (n === null) return { text: "", late: false };
  if (n < 0) return { text: `${-n} day${n === -1 ? "" : "s"} overdue`, late: true };
  if (n === 0) return { text: "today", late: false };
  if (n === 1) return { text: "tomorrow", late: false };
  return { text: `in ${n} days`, late: false };
}

// "2026-11-13" -> "13 Nov 2026"
export function prettyDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}