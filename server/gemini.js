// Talks to Google Gemini: picks a working model and moves on when one is busy.

const API = "https://generativelanguage.googleapis.com/v1beta";

// Shared with index.js: the model that last worked and the last failure
export const state = { model: null, lastError: null };

const getKey = () => process.env.GEMINI_API_KEY;
export const hasKey = () => Boolean(getKey()) && getKey() !== "your_api_key_here";

const preferred = () =>
  [
    process.env.GEMINI_MODEL,
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
  ].filter(Boolean);

// One request to one model
async function callModel(model, payload) {
  const r = await fetch(`${API}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": getKey() },
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
    headers: { "x-goog-api-key": getKey() },
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json().catch(() => ({}));
  return (d.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => m.name.replace("models/", ""))
    .filter(
      (n) =>
        /flash/i.test(n) &&
        !/(tts|image|live|audio|embedding|robotics|computer|exp|preview|omni)/i.test(n)
    )
    .sort((a, b) => Number(/lite/i.test(b)) - Number(/lite/i.test(a)) || a.localeCompare(b))
    .slice(0, 4);
}

// Try several models. Skip ones that are busy or retired; stop on real errors.
export async function generate(payload) {
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
        state.model = model;
        return out;
      }
      // A bad key or bad request fails on every model, so stop here
      if (!isModelProblem(out) && !isBusy(out)) return out;
    }
    return null;
  }

  const known = [...new Set([state.model, ...preferred()].filter(Boolean))];
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