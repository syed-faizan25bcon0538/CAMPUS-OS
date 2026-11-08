import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const KEY = process.env.GEMINI_API_KEY;
const hasKey = Boolean(KEY) && KEY !== "your_api_key_here";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const SYSTEM_PROMPT = `You are Campus OS, a friendly assistant for college students.
Help with:
- Study doubts: explain clearly, with simple examples.
- Assignment problems: guide the student step by step instead of just giving final answers.
- Planning: use the student's tasks, classes and deadlines to suggest what to do first.
- Hackathon questions: give practical, concise advice.
Keep answers short and clear. If you are unsure, say so.`;

app.get("/api/health", (req, res) => {
  res.json({ ok: true, aiConfigured: hasKey });
});

app.post("/api/chat", async (req, res) => {
  if (!hasKey) {
    return res.status(503).json({
      error:
        "AI is not configured yet. Add GEMINI_API_KEY to the server settings and restart.",
    });
  }

  const { messages, context } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  // Keep valid, recent messages and convert to Gemini's format
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
      parts: [{ text: m.content }],
    }));

  // The conversation must start with a user message
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length) {
    return res.status(400).json({ error: "No valid user message found" });
  }

  const system = context
    ? `${SYSTEM_PROMPT}\n\nStudent's current data:\n${String(context).slice(0, 4000)}`
    : SYSTEM_PROMPT;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: clean,
          generationConfig: { maxOutputTokens: 2048 },
        }),
      }
    );
    const data = await r.json();

    if (!r.ok) {
      console.error("Gemini error:", data?.error?.message);
      const busy = r.status === 429;
      return res.status(busy ? 429 : 500).json({
        error: busy
          ? "The AI is busy right now (free limit reached). Please wait a minute and try again."
          : "The AI request failed. Please try again.",
      });
    }

    const reply = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();
    res.json({
      reply: reply || "Sorry, I couldn't come up with an answer. Try rephrasing.",
    });
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ error: "The AI request failed. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Campus OS server running on http://localhost:${PORT}`);
  if (!hasKey)
    console.log("Note: no GEMINI_API_KEY set, so the AI assistant is disabled.");
});