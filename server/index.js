import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions, originGuard, perVisitor, overall } from "./limits.js";
import { generate, hasKey, state } from "./gemini.js";

const app = express();
const PORT = process.env.PORT || 5000;
const DEBUG_TOKEN = process.env.DEBUG_TOKEN || "";
const MAX_MESSAGE_CHARS = 4000;

app.disable("x-powered-by");
app.set("trust proxy", 1); // Render sits behind one proxy; this gives us the visitor's real address
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));

const SYSTEM_PROMPT = `You are Campus OS, a friendly assistant for college students.
Help with:
- Study doubts: explain clearly, with simple examples.
- Assignment problems: guide the student step by step instead of just giving final answers.
- Planning: use the student's tasks, classes and deadlines to suggest what to do first.
- Hackathon questions: give practical, concise advice.
Keep answers short and clear. If you are unsure, say so.
Write in plain text only. Do not use markdown symbols such as ** or # or ---. Use simple numbered lines or short paragraphs instead.`;

// Public: only says the server is up. Details need the debug token.
app.get("/api/health", (req, res) => {
  const body = { ok: true, aiConfigured: hasKey() };
  if (DEBUG_TOKEN && req.query.debug === DEBUG_TOKEN) {
    body.model = state.model;
    body.lastError = state.lastError;
  }
  res.json(body);
});

app.post("/api/chat", originGuard, perVisitor, overall, async (req, res) => {
  if (!hasKey()) {
    return res.status(503).json({
      error: "AI is not configured yet. Add GEMINI_API_KEY to the server settings.",
    });
  }

  const { messages, context } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  const clean = messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-12)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.slice(0, MAX_MESSAGE_CHARS) }],
    }));

  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length) {
    return res.status(400).json({ error: "No valid user message found" });
  }

  const system = context
    ? `${SYSTEM_PROMPT}\n\nStudent's current data:\n${String(context).slice(0, 4000)}`
    : SYSTEM_PROMPT;

  try {
    const out = await generate({
      systemInstruction: { parts: [{ text: system }] },
      contents: clean,
      generationConfig: { maxOutputTokens: 2048 },
    });

    if (!out.ok) {
      const msg = out.data?.error?.message || "Unknown error";
      state.lastError = `${out.status}: ${msg}`.slice(0, 300);
      console.error("Gemini error:", state.lastError);
      const busy = [429, 503, 504].includes(out.status);
      return res.status(busy ? 429 : 500).json({
        error: busy
          ? "The AI is busy right now. Please wait a minute and try again."
          : "The AI request failed. Please try again in a moment.",
      });
    }

    state.lastError = null;
    const reply = (out.data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();
    res.json({
      reply: reply || "Sorry, I couldn't come up with an answer. Try rephrasing.",
    });
  } catch (err) {
    state.lastError = `${err.name}: ${err.message}`.slice(0, 300);
    console.error("AI error:", state.lastError);
    res.status(500).json({ error: "The AI request failed. Please try again." });
  }
});

// Always answer with JSON, even for bad requests
app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid request." });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "That request is too large." });
  }
  console.error("Server error:", err?.message);
  res.status(500).json({ error: "Server error." });
});

app.listen(PORT, () => {
  console.log(`Campus OS server running on http://localhost:${PORT}`);
  if (!hasKey()) console.log("Note: no GEMINI_API_KEY set, so the AI assistant is disabled.");
});