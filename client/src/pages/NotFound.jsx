import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

// Shown for any address that doesn't exist, such as /app/banana
export default function NotFound() {
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
      <div className="empty" style={{ maxWidth: 420 }}>
        <div className="empty-icon">
          <Compass size={26} />
        </div>
        <h1 className="page-title">404</h1>
        <div className="empty-title">This page doesn't exist</div>
        <p>The address may be mistyped, or the page may have moved.</p>

        <div className="row-wrap mt" style={{ justifyContent: "center" }}>
          <Link to="/app" className="btn btn-primary">
            Go to dashboard
          </Link>
          <Link to="/" className="btn btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}