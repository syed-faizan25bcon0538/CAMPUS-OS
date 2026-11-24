// A small message in the corner: "Loading…" or an error with a Dismiss button
export default function DataStatus({ loading, error, onDismiss }) {
  if (!loading && !error) return null;

  const box = {
    position: "fixed",
    right: 20,
    bottom: 20,
    zIndex: 100,
    maxWidth: 360,
    padding: "12px 14px",
    borderRadius: 12,
    boxShadow: "var(--shadow-md)",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  if (error) {
    return (
      <div role="alert" style={{ ...box, background: "var(--red-soft)", color: "var(--red)" }}>
        <span className="grow">{error}</span>
        <button
          className="btn btn-ghost"
          style={{ height: 30, padding: "0 8px", color: "inherit" }}
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      style={{
        ...box,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text-2)",
      }}
    >
      Loading your data…
    </div>
  );
}