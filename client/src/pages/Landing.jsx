import Button from "../components/ui/Button.jsx";
import Logo from "../components/ui/Logo.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { cx } from "../utils/cx.js";
import "../styles/pages/landing.css";

const PREVIEW_DAYS = ["Mon", "Tue", "Wed", "Thu"];

const PREVIEW_ROWS = [
  {
    time: "8:30",
    cells: [
      { title: "Web Prog", meta: "CS-3" },
      { title: "AI", meta: "E-14" },
      { title: "AI", meta: "Quiz 3" },
      { title: "Web Prog", meta: "CS-3" },
    ],
  },
  {
    time: "10:00",
    cells: [
      { title: "Compiler", meta: "CS-5" },
      { title: "Deep Learn", meta: "E-7" },
      null,
      { title: "Compiler", meta: "CS-5" },
    ],
  },
  {
    time: "11:30",
    cells: [{ title: "Info Sec", meta: "B-2" }, null, { title: "Clash", meta: "2 classes", clash: true }, null],
  },
];

const FEATURES = [
  { title: "Timetable upload", text: "Import the Excel timetable and add your sections as weekly classes." },
  { title: "Date sheets", text: "Add midterm and final exams with reminders before each paper." },
  { title: "Clash detection", text: "Get a warning when two selected sections overlap." },
  { title: "Assignments and quizzes", text: "Track due dates alongside your classes." },
  { title: "Attendance tracker", text: "See how many classes you can still miss in each course." },
  { title: "Share and export", text: "Share a schedule with a code, or download it as PDF or image." },
];

const STEPS = [
  { title: "Upload the file", text: "Use the timetable or date sheet exactly as the university shares it." },
  { title: "Select your sections", text: "Pick a section for each course and check for clashes." },
  { title: "Stay on schedule", text: "Get reminders, a morning summary and an exportable timetable." },
];

function SchedulePreview() {
  return (
    <div className="landing-preview">
      <div className="landing-preview__header">
        <strong>Week of 9 November</strong>
        <span className="text-muted">BCS-7A</span>
      </div>
      <div className="data-table-wrapper">
        <table className="landing-preview__table">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Time</span>
              </th>
              {PREVIEW_DAYS.map((day) => (
                <th key={day} scope="col">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PREVIEW_ROWS.map((row) => (
              <tr key={row.time}>
                <th scope="row">{row.time}</th>
                {row.cells.map((cell, index) => (
                  <td key={`${row.time}-${PREVIEW_DAYS[index]}`}>
                    {cell && (
                      <div className={cx("landing-preview__event", cell.clash && "landing-preview__event--clash")}>
                        <strong>{cell.title}</strong>
                        <span>{cell.meta}</span>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const primaryAction = isAuthenticated
    ? { to: "/app", label: "Open dashboard" }
    : { to: "/register", label: "Create an account" };

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-container landing-nav__inner">
          <Logo />
          <nav className="landing-nav__links" aria-label="Main">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            {isAuthenticated ? (
              <Button to="/app" variant="primary">
                Dashboard
              </Button>
            ) : (
              <>
                <a href="/login">Log in</a>
                <Button to="/register" variant="primary">
                  Sign up
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-container landing-hero">
          <div className="landing-hero__text">
            <span className="landing-hero__eyebrow">Semester schedule manager</span>
            <h1 className="landing-hero__title">Your timetable, date sheets and deadlines in one calendar.</h1>
            <p className="landing-hero__lead">
              Upload the Excel files your university shares, select your courses and sections, and SemesterSync builds
              your calendar with reminders.
            </p>
            <div className="landing-hero__actions">
              <Button to={primaryAction.to} variant="primary" size="lg">
                {primaryAction.label}
              </Button>
              <a href="#how-it-works" className="btn btn--secondary btn--lg">
                How it works
              </a>
            </div>
          </div>
          <SchedulePreview />
        </section>

        <section id="features" className="landing-section landing-section--muted">
          <div className="landing-container landing-section__inner">
            <div className="landing-section__intro">
              <h2 className="landing-section__title">Features</h2>
              <p className="landing-section__lead">
                Everything needed to keep track of a semester, without copying schedules by hand.
              </p>
            </div>
            <div className="feature-grid">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="feature-grid__item">
                  <h3 className="feature-grid__title">{feature.title}</h3>
                  <p className="feature-grid__text">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="landing-section">
          <div className="landing-container landing-section__inner">
            <h2 className="landing-section__title">How it works</h2>
            <ol className="landing-steps">
              {STEPS.map((step, index) => (
                <li key={step.title} className={cx("landing-steps__item", index === 0 && "landing-steps__item--active")}>
                  <span className="landing-steps__label">Step {index + 1}</span>
                  <h3 className="landing-steps__title">{step.title}</h3>
                  <p className="landing-steps__text">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-container landing-cta__inner">
            <div>
              <h2 className="landing-cta__title">Start this semester organised.</h2>
              <p className="text-secondary">Setup takes about two minutes.</p>
            </div>
            <Button to={primaryAction.to} variant="primary" size="lg">
              {primaryAction.label}
            </Button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer__inner">
          <span>SemesterSync · Web Programming project, BCS 7A</span>
          <span>Haider (23L-0634)</span>
        </div>
      </footer>
    </div>
  );
}
