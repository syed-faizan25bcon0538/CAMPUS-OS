import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;
const KEY = process.env.GEMINI_API_KEY;
const hasKey = Boolean(KEY) && KEY !== "your_api_key_here";
const API = "https://generativelanguage.googleapis.com/v1beta";
const PREFERRED = [
  process.env.GEMINI_MODEL,
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
].filter(Boolean);

let activeModel = null; // the model that last worked
let lastError = null; // the last failure, shown on /api/health

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const SYSTEM_PROMPT = `You are Campus OS, a friendly assistant for college students.
Help with:
- Study doubts: explain clearly, with simple examples.
- Assignment problems: guide the student step by step instead of just giving final answers.
- Planning: use the student's tasks, classes and deadlines to suggest what to do first.
- Hackathon questions: give practical, concise advice.
Keep answers short and clear. If you are unsure, say so.
Write in plain text only. Do not use markdown symbols such as ** or # or ---. Use simple numbered lines or short paragraphs instead.`;

// One request to one model
async function callModel(model, payload) {
  const r = await fetch(`${API}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

// The model itself is retired, renamed or unsupported
const isModelProblem = (out) =>
  !out.ok &&
  (out.status === 404 ||
    /not found|no longer available|not supported|deprecated/i.test(
      out.data?.error?.message || ""
    ));

// Temporary overload or rate limit: another model may still work
const isBusy = (out) => !out.ok && [429, 500, 503, 504].includes(out.status);

// Ask Google which Flash models this key can use
async function discoverModels() {
  const r = await fetch(`${API}/models?pageSize=200`, {
    headers: { "x-goog-api-key": KEY },
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json().catch(() => ({}));
  return (d.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => m.name.replace("models/", ""))
    .filter(
      (n) =>
        /flash/i.test(n) &&
        !/(tts|image|live|audio|embedding|robotics|computer|exp)/i.test(n)
    )
    .sort((a, b) => Number(/lite/i.test(a)) - Number(/lite/i.test(b)) || b.localeCompare(a))
    .slice(0, 4);
}

// Try several models. Skip ones that are busy or retired; stop on real errors.
async function generate(payload) {
  const deadline = Date.now() + 70000; // never keep the user waiting longer
  let last = null;

  async function pass(models) {
    for (const model of models) {
      if (Date.now() > deadline) return null;
      let out;
      try {
        out = await callModel(model, payload);
      } catch (err) {
        last = {
          ok: false,
          status: 504,
          data: { error: { message: `${model}: ${err.name}` } },
        };
        continue;
      }
      last = out;
      if (out.ok) {
        activeModel = model;
        return out;
      }
      // A bad key or bad request will fail on every model, so stop here
      if (!isModelProblem(out) && !isBusy(out)) return out;
    }
    return null;
  }

  const known = [...new Set([activeModel, ...PREFERRED].filter(Boolean))];
  let out = await pass(known);
  if (out) return out;

  let found = [];
  try {
    found = (await discoverModels()).filter((m) => !known.includes(m));
  } catch {
    // ignore: we report the last error instead
  }
  out = await pass(found);
  if (out) return out;

  // Everything was busy: wait a moment and go round once more
  if (last && isBusy(last) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    out = await pass([...known, ...found]);
    if (out) return out;
  }

  return (
    last || {
      ok: false,
      status: 500,
      data: { error: { message: "No usable Gemini model was found for this key." } },
    }
  );
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, aiConfigured: hasKey, model: activeModel, lastError });
});

app.post("/api/chat", async (req, res) => {
  if (!hasKey) {
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
      parts: [{ text: m.content }],
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
      lastError = `${out.status}: ${msg}`.slice(0, 300);
      console.error("Gemini error:", lastError);
      const busy = [429, 503, 504].includes(out.status);
      return res.status(busy ? 429 : 500).json({
        error: busy
          ? "The AI is busy right now. Please wait a minute and try again."
          : `The AI request failed (${out.status}). ${msg.slice(0, 160)}`,
      });
    }

    lastError = null;
    const reply = (out.data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();
    res.json({
      reply: reply || "Sorry, I couldn't come up with an answer. Try rephrasing.",
    });
  } catch (err) {
    lastError = `${err.name}: ${err.message}`.slice(0, 300);
    console.error("AI error:", lastError);
    res.status(500).json({ error: "The AI request failed. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Campus OS server running on http://localhost:${PORT}`);
  if (!hasKey) console.log("Note: no GEMINI_API_KEY set, so the AI assistant is disabled.");
});