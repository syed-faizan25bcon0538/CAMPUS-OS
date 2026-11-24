import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// A coloured message box used for errors and notices
function Banner({ tone, children }) {
  const colours =
    tone === "ok"
      ? { background: "var(--green-soft)", color: "var(--green)" }
      : { background: "var(--red-soft)", color: "var(--red)" };
  return (
    <div
      role={tone === "ok" ? "status" : "alert"}
      style={{ ...colours, padding: "10px 12px", borderRadius: 10, marginTop: 16, fontSize: 14 }}
    >
      {children}
    </div>
  );
}

export default function Login() {
  const { user, loading, configured, signIn, signUp } = useAuth();
  const location = useLocation();

  // Where to go after signing in: the page you were trying to open, or the dashboard
  const destination = location.state?.from?.pathname || "/app";

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Already signed in: go straight to the app
  if (!loading && user) return <Navigate to={destination} replace />;

  function switchMode() {
    setIsSignUp((v) => !v);
    setPassword("");
    setError("");
    setNotice("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    setBusy(true);

    const result = isSignUp ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (isSignUp && result.needsConfirmation) {
      setNotice(
        `We sent a confirmation link to ${email.trim()}. Open it, then come back here and sign in.`
      );
      setPassword("");
      setIsSignUp(false);
    }
    // Otherwise the new session is picked up by the auth context and the redirect above takes over
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Link to="/" className="brand" style={{ justifyContent: "center", padding: "0 0 20px" }}>
          <span className="brand-mark">C</span>
          Campus OS
        </Link>

        <div className="card">
          <h1 className="page-title" style={{ fontSize: 22 }}>
            {isSignUp ? "Create your account" : "Sign in to Campus OS"}
          </h1>
          <p className="page-sub">
            {isSignUp
              ? "Your tasks, notes and timetable will follow you to any device."
              : "Welcome back. Enter your details to continue."}
          </p>

          {!configured && <Banner tone="error">Login isn't set up on this site yet.</Banner>}
          {error && <Banner tone="error">{error}</Banner>}
          {notice && <Banner tone="ok">{notice}</Banner>}

          <form onSubmit={handleSubmit} className="stack mt">
            <div className="field">
              <label className="label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={isSignUp ? 8 : undefined}
                placeholder={isSignUp ? "At least 8 characters" : "Your password"}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={busy || !configured}>
              {busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt" style={{ textAlign: "center" }}>
            <button className="btn btn-ghost" type="button" onClick={switchMode}>
              {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          </div>
        </div>

        <p className="item-sub" style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </div>
  );
}