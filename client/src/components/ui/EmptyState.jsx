// A friendly message shown when a list has nothing in it yet.
// Usage:  <EmptyState icon={ListChecks} title="No tasks yet" text="..." />
export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty-icon">
          <Icon size={24} />
        </div>
      )}
      <div className="empty-title">{title}</div>
      {text && <div>{text}</div>}
      {children}
    </div>
  );
}