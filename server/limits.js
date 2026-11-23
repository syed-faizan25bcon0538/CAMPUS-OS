// Rules that protect the AI endpoint: which websites may call it, and how often.

export function isAllowedOrigin(origin) {
  const extra = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    /^http:\/\/localhost:\d+$/.test(origin) || // your computer
    origin === "https://campus-os-kappa-eight.vercel.app" || // the live site
    /^https:\/\/campus-os-[a-z0-9-]+-syed-faizan-iftikhar\.vercel\.app$/.test(origin) || // previews
    extra.includes(origin)
  );
}

// Lets a browser talk to this server only from allowed websites
export const corsOptions = {
  origin(origin, callback) {
    // No Origin header means a direct request, such as a health check
    callback(null, !origin || isAllowedOrigin(origin));
  },
};

// Refuses chat requests that come from a website we don't know
export function originGuard(req, res, next) {
  const origin = req.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: "This website is not allowed to use the assistant." });
  }
  next();
}

// Counts requests per key and refuses the extras. Kept in memory, so it resets on restart.
function rateLimit({ windowMs, max, message, keyFn = (req) => req.ip }) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, h] of hits) if (h.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    let h = hits.get(key);
    if (!h || h.resetAt <= now) {
      h = { count: 0, resetAt: now + windowMs };
      hits.set(key, h);
    }
    h.count += 1;
    if (h.count > max) {
      res.set("Retry-After", String(Math.ceil((h.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

// Defaults can be changed with environment variables
const PER_VISITOR = Number(process.env.CHAT_PER_VISITOR) || 20; // messages...
const WINDOW_MIN = Number(process.env.CHAT_WINDOW_MIN) || 10; // ...per this many minutes
const GLOBAL_PER_HOUR = Number(process.env.CHAT_GLOBAL_PER_HOUR) || 300; // all visitors together

export const perVisitor = rateLimit({
  windowMs: WINDOW_MIN * 60 * 1000,
  max: PER_VISITOR,
  message: "You are sending messages too quickly. Please wait a few minutes and try again.",
});

export const overall = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: GLOBAL_PER_HOUR,
  keyFn: () => "all",
  message: "The assistant has reached its hourly limit. Please try again later.",
});