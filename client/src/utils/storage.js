import { useState, useEffect } from "react";

const PREFIX = "cos_";

// Read a saved value from the browser, or use the fallback if nothing is saved
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Like useState, but the value is saved in the browser automatically
export function useStore(key, initial) {
  const [value, setValue] = useState(() => load(key, initial));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be full or blocked; the app still works without saving
    }
  }, [key, value]);

  return [value, setValue];
}

// Remove everything Campus OS has saved
export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// A simple unique id for each new item
export function newId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}