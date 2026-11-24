import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useStore } from "../utils/storage.js";
import { todayStr } from "../utils/dates.js";
import PageHeader from "../components/ui/PageHeader.jsx";

// Where the server lives. Empty on your computer (the dev proxy handles it);
// set to the Render address on the live site through VITE_API_URL.
const API = import.meta.env.VITE_API_URL || "";

const SUGGESTIONS = [
  "Plan my week",
  "What should I do first today?",
  "Explain recursion simply",
  "Help me prioritise my deadlines",
];

const WELCOME =
  "Hi! I can help with study doubts, assignments, planning around your deadlines and hackathon questions. I can see your tasks, timetable, events and notes, so just ask.";

// Turns the student's data into plain text the AI can read
function buildContext({ tasks, classes, events, notes }) {
  const t =
    tasks
      .map((x) => `${x.title}${x.due ? ` (due ${x.due})` : ""}${x.done ? " [done]" : ""}`)
      .join("; ") || "none";
  const c =
    classes.map((x) => `${x.title} on ${x.day} ${x.time || ""}`.trim()).join("; ") || "none";
  const e = events.map((x) => `${x.title} (${x.kind}, ${x.date})`).join("; ") || "none";
  const n =
    notes
      .map((x) => `${x.title}: ${x.body || ""}`)
      .join(" | ")
      .slice(0, 1500) || "none";
  return `Today is ${todayStr()}.\nTasks: ${t}\nClasses: ${c}\nEvents and deadlines: ${e}\nNotes: ${n}`;
}

export default function Assistant() {
  const { tasks, classes, events, notes } = useData();
  const { session } = useAuth();

  const [chat, setChat] = useStore("cos_chat", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const endRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  // If a reply takes a while, explain why (the free server may be asleep)
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;

    const next = [...chat, { role: "user", content: q }];
    setChat(next);
    setInput("");
    setLoading(true);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in again to use the AI assistant.");

      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(120000),
        body: JSON.stringify({
          messages: next.filter((m) => !m.error),
          context: buildContext({ tasks, classes, events, notes }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setChat([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      let msg = err.message;
      if (err.name === "TimeoutError") {
        msg = "The server took too long to respond. Please try again in a moment.";
      } else if (err instanceof TypeError) {
        msg = "Can't reach the server. Check your connection and try again.";
      }
      setChat([...next, { role: "assistant", content: msg, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="AI assistant"
        subtitle="Ask about your studies, assignments or schedule. It can see your tasks, timetable, events and notes."
      >
        {chat.length > 0 && (
          <button className="btn btn-secondary" onClick={() => setChat([])}>
            <Trash2 size={16} />
            Clear chat
          </button>
        )}
      </PageHeader>

      <div className="card chat-card">
        <div className="chat-messages">
          {chat.length === 0 && <div className="msg msg-bot">{WELCOME}</div>}

          {chat.map((m, i) => (
            <div
              key={i}
              className={
                "msg " +
                (m.role === "user" ? "msg-user" : "msg-bot") +
                (m.error ? " msg-error" : "")
              }
            >
              {m.content}
            </div>
          ))}

          {loading && (
            <div className="msg msg-bot">
              <div className="typing" aria-label="The assistant is typing">
                <span />
                <span />
                <span />
              </div>
              {slow && (
                <div className="item-sub">
                  The free server may be waking up. This can take up to a minute.
                </div>
              )}
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="chat-footer">
          {chat.length === 0 && (
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="row">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a doubt, plan your week, explain a topic…"
              disabled={loading}
              aria-label="Message the assistant"
            />
            <button
              className="btn btn-primary"
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}