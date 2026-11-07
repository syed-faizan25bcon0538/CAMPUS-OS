import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const PORT = process.env.PORT || 5000;
const MODEL = process.env.MODEL || "claude-sonnet-5-5";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const hasKey =
  process.env.ANTHROPIC_API_KEY &&
  process.env.ANTHROPIC_API_KEY !== "your_api_key_here";
const anthropic = hasKey ? new Anthropic() : null;

const SYSTEM_PROMPT = `You are Campus OS, a friendly assistant for college students.
Help with:
- Study doubts: explain clearly, with simple examples.
- Assignment problems: guide the student step by step instead of just giving final answers.
- Planning: use the student's tasks, classes and deadlines to suggest what to do first.
- Hackathon questions: give practical, concise advice.
Keep answers short and clear. If you are unsure, say so.`;

app.get("/api/health", (req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(anthropic) });
});

app.post("/api/chat", async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({
      error:
        "AI is not configured yet. Add your ANTHROPIC_API_KEY to server/.env and restart the server.",
    });
  }

  const { messages, context } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  // Keep only valid, recent messages
  const clean = messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));

  // The conversation must start with a user message
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length) {
    return res.status(400).json({ error: "No valid user message found" });
  }

  const system = context
    ? `${SYSTEM_PROMPT}\n\nStudent's current data:\n${String(context).slice(0, 4000)}`
    : SYSTEM_PROMPT;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: clean,
    });
    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    res.json({ reply });
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ error: "The AI request failed. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Campus OS server running on http://localhost:${PORT}`);
  if (!anthropic) console.log("Note: no API key set, so the AI assistant is disabled.");
});