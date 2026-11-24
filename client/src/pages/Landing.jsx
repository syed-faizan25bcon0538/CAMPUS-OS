import { Link } from "react-router-dom";
import {
  ListChecks,
  CalendarClock,
  NotebookPen,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Tasks",
    text: "Track assignments with due dates, filters and overdue alerts, so nothing slips.",
  },
  {
    icon: CalendarClock,
    title: "Timetable",
    text: "A weekly view of your classes, one column per day, with today highlighted.",
  },
  {
    icon: NotebookPen,
    title: "Notes",
    text: "Capture lecture notes and ideas, then find them again with instant search.",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    text: "Exams, deadlines and events with a live countdown for each one.",
  },
  {
    icon: Sparkles,
    title: "AI assistant",
    text: "Ask study doubts or get help planning around your deadlines. It can see your schedule.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Your data is saved in your own account and is only shared with the AI when you ask it something.",
  },
];

// A static sample of the app, so visitors can see what they are getting
function Preview() {
  const rows = [
    { title: "DBMS assignment", sub: "Task", badge: "Due tomorrow", tone: "badge-amber" },
    { title: "Data Structures", sub: "Class · 10:00", badge: "Today", tone: "badge-accent" },
    { title: "Mid-semester exam", sub: "Exam", badge: "in 5 days", tone: "" },
    { title: "Hackathon submission", sub: "Deadline", badge: "in 9 days", tone: "badge-red" },
  ];

  return (
    <div
      className="card"
      style={{
        maxWidth: 640,
        margin: "48px auto 0",
        textAlign: "left",
        boxShadow: "var(--shadow-md)",
      }}
      aria-hidden="true"
    >
      <div className="card-title">
        Coming up
        <span className="badge badge-accent">Sample</span>
      </div>
      {rows.map((r) => (
        <div className="list-item" key={r.title}>
          <div className="grow">
            <div className="item-title">{r.title}</div>
            <div className="item-sub">{r.sub}</div>
          </div>
          <span className={"badge " + r.tone}>{r.badge}</span>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <>
      {/* ----- Top bar ----- */}
      <div className="container">
        <header className="landing-nav">
          <Link to="/" className="brand" style={{ padding: 0 }}>
            <span className="brand-mark">C</span>
            Campus OS
          </Link>

          <div className="row">
            <a href="#features" className="btn btn-ghost">
              Features
            </a>
            <Link to="/app" className="btn btn-primary">
              Open app
            </Link>
          </div>
        </header>
      </div>

      {/* ----- Hero ----- */}
      <section className="hero">
        <div className="container">
          <span className="badge badge-accent hero-badge">Built for students</span>
          <h1>
            Your whole semester, <span>organised in one place.</span>
          </h1>
          <p>
            Campus OS brings your tasks, timetable, notes and deadlines together, with an AI
            assistant that actually knows your schedule.
          </p>

          <div className="hero-actions">
            <Link to="/app" className="btn btn-primary btn-lg">
              Get started <ArrowRight size={18} />
            </Link>
            <Link to="/app/assistant" className="btn btn-secondary btn-lg">
              <Sparkles size={18} />
              Try the AI assistant
            </Link>
          </div>

          <Preview />
        </div>
      </section>

      {/* ----- Features ----- */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-head">
            <h2>Everything a student needs</h2>
            <p>Six tools that work together, each on its own page.</p>
          </div>

          <div className="features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div className="feature-card" key={title}>
                <div className="stat-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----- Call to action ----- */}
      <section className="section">
        <div className="container">
          <div className="cta-band">
            <h2>Ready to get organised?</h2>
            <p>It's free. Create an account in seconds and your planner follows you everywhere.</p>
            <Link to="/app" className="btn btn-lg">
              Open Campus OS <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ----- Footer ----- */}
      <footer className="container">
        <div className="landing-footer row-wrap" style={{ justifyContent: "space-between" }}>
          <span>© {new Date().getFullYear()} Campus OS</span>
          <span>Built with React, Node.js and Gemini</span>
        </div>
      </footer>
    </>
  );
}