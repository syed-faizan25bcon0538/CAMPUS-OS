import { useState, useRef, useEffect } from "react";
import { todayStr } from "../utils/dates.js";
import { useStore } from "../utils/storage.js";

const SUGGESTIONS = [
  "Plan my week",
  "Explain recursion simply",
  "Help me prioritise my deadlines",
  "Tips for the hackathon demo",
];

const WELCOME =
  "Hi! I can help with study doubts, assignments, planning your deadlines and hackathon questions. I can see your tasks, classes, events and notes.";

// Turn the student's data into plain text the AI can read
function buildContext({ tasks, classes, events, notes }) {
  const t =
    tasks
      .map((x) => `${x.title}${x.due ? ` (due ${x.due})` : ""}${x.done ? " [done]" : ""}`)
      .join("; ") || "none";
  const c =
    classes.map((x) => `${x.title} on ${x.day} ${x.time || ""}`.trim()).join("; ") ||
    "none";
  const e =
    events.map((x) => `${x.title} (${x.kind}, ${x.date})`).join("; ") || "none";
  const n =
    notes
      .map((x) => `${x.title}: ${x.body || ""}`)
      .join(" | ")
      .slice(0, 1500) || "none";
  return `Today is ${todayStr()}.\nTasks: ${t}\nClasses: ${c}\nEvents and deadlines: ${e}\nNotes: ${n}`;
}

export default function Assistant({ tasks, classes, events, notes }) {
  const [chat, setChat] = useStore("cos_chat", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;

    const next = [...chat, { role: "user", content: q }];
    setChat(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => !m.error),
          context: buildContext({ tasks, classes, events, notes }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setChat([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const msg =
        err.message === "Failed to fetch"
          ? "Can't reach the server. Make sure it is running (npm run dev)."
          : err.message;
      setChat([...next, { role: "assistant", content: msg, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setChat([]);
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>AI assistant</h2>
        {chat.length > 0 && (
          <button className="btn-ghost" onClick={clearChat}>
            Clear chat
          </button>
        )}
      </div>

      <div className="chips">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="chat">
        {chat.length === 0 && <div className="msg bot">{WELCOME}</div>}
        {chat.map((m, i) => (
          <div
            key={i}
            className={
              "msg " + (m.role === "user" ? "user" : "bot") + (m.error ? " error" : "")
            }
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="msg bot muted">Thinking…</div>}
        <div ref={endRef} />
      </div>

      <div className="row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a doubt, plan your week, explain a topic…"
          disabled={loading}
        />
        <button className="btn" onClick={() => send()} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}