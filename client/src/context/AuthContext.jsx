import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseReady } from "../utils/supabase.js";

// Shared "who is signed in" box. Any page opens it with useAuth().
const AuthContext = createContext(null);

// Turns Supabase's technical messages into friendly ones
function friendly(error) {
  const m = (error?.message || "").toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match. Check them and try again.";
  if (m.includes("not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("already registered")) return "An account with that email already exists. Try signing in instead.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("password")) return error.message; // already readable, e.g. "at least 6 characters"
  if (m.includes("valid email") || m.includes("invalid email")) return "Please enter a valid email address.";
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // While we check for a saved login we are "loading". Without Supabase settings there is nothing to wait for.
  const [loading, setLoading] = useState(supabaseReady);

  useEffect(() => {
    if (!supabaseReady) return;
    let active = true;

    // 1. Is there a saved login from an earlier visit?
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));

    // 2. Hear about later sign-ins and sign-outs, in this tab or another
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      configured: supabaseReady, // false means login is not set up on this site
      loading, // true while the saved login is being checked
      session,
      user: session?.user ?? null,

      async signIn(email, password) {
        if (!supabaseReady) return { error: "Login is not set up on this site yet." };
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        return { error: error ? friendly(error) : null };
      },

      async signUp(email, password) {
        if (!supabaseReady) return { error: "Login is not set up on this site yet." };
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) return { error: friendly(error) };
        // For an email that already exists, Supabase answers with a user that has no identities
        if (data.user && data.user.identities?.length === 0) {
          return { error: friendly({ message: "already registered" }) };
        }
        // No session yet means the email must be confirmed first
        return { error: null, needsConfirmation: !data.session };
      },

      async signOut() {
        // Remove the saved AI chat so the next person on this browser can't see it
        try {
          localStorage.removeItem("cos_chat");
        } catch {
          // storage can be blocked; nothing to clear then
        }
        if (supabaseReady) await supabase.auth.signOut();
      },
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The hook every page uses:  const { user, signIn } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}