// The title block at the top of every page.
// Usage:  <PageHeader title="Tasks" subtitle="..."> <button/> </PageHeader>
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {children && <div className="row-wrap">{children}</div>}
    </div>
  );
}