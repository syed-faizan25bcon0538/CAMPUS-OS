import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// Wraps the pages that need a login.
// Signed-in visitors see the page; signed-out visitors are sent to /login.
export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // We are still checking for a saved login. Don't flash the login page at someone who is signed in.
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="typing" aria-label="Loading">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (!user) {
    // Remember the page they asked for, so we can bring them back after they sign in
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}