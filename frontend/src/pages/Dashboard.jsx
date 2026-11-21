import { useMemo } from "react";
import { Link } from "react-router-dom";
import AttendanceGauge from "../components/charts/AttendanceGauge.jsx";
import CourseHoursChart from "../components/charts/CourseHoursChart.jsx";
import WorkloadChart from "../components/charts/WorkloadChart.jsx";
import SemesterNotice from "../components/app/SemesterNotice.jsx";
import AttendanceMarker from "../components/app/AttendanceMarker.jsx";
import CourseCell from "../components/app/CourseCell.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Notice from "../components/ui/Notice.jsx";
import Panel from "../components/ui/Panel.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSchedule } from "../hooks/useSchedule.js";
import { getAttendanceSummary, getLowestAttendance } from "../utils/attendance.js";
import { describeClash, findClashes } from "../utils/clashes.js";
import { cx } from "../utils/cx.js";
import { getDailyWorkload, getHoursByCourse, getOverallAttendance, getWeeklyWorkload } from "../utils/dashboardStats.js";
import {
  addDays,
  combineDateTime,
  differenceInDays,
  formatDayMonth,
  formatLongDate,
  formatTime,
  getGreeting,
  startOfDay,
  timeToMinutes,
  toTimeKey,
} from "../utils/date.js";
import { examTermLabel } from "../utils/examTerms.js";
import { getClassesOnDate, getExams, getSelectedCourses, getTasksWithCourses } from "../utils/schedule.js";
import "../styles/pages/dashboard.css";

const UPCOMING_LIMIT = 6;

function classStatus(instance, now) {
  if (instance.cancelled) return "cancelled";
  if (now >= combineDateTime(instance.dateKey, instance.end)) return "done";
  if (now >= combineDateTime(instance.dateKey, instance.start)) return "live";
  return instance.kind === "makeup" ? "makeup" : "upcoming";
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function daysAway(date, now) {
  const days = differenceInDays(startOfDay(date), startOfDay(now));
  if (days <= 0) return { label: "Today", variant: "warning" };
  if (days === 1) return { label: "Tomorrow", variant: "info" };
  return { label: `In ${days} days`, variant: "secondary" };
}

function KpiCard({ label, value, detail, tone }) {
  return (
    <div className="kpi-card">
      <span className="kpi-card__label">{label}</span>
      <span className={cx("kpi-card__value", tone && `kpi-card__value--${tone}`)}>{value}</span>
      {detail && <span className="kpi-card__detail">{detail}</span>}
    </div>
  );
}

function TableSection({ title, link, children }) {
  return (
    <section className="dash-section">
      <header className="dash-section__header">
        <h2 className="dash-section__title">{title}</h2>
        {link && (
          <Link to={link.to} className="dash-section__link">
            {link.label}
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

function TodayClasses({ classes, marks, now, onMark }) {
  if (classes.length === 0) {
    return (
      <div className="data-table-wrapper">
        <EmptyState variant="compact" title="No classes today" description="Enjoy the free day, or catch up on assignments." />
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table data-table--zebra dashboard-classes">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Course</th>
            <th scope="col">Room</th>
            <th scope="col">Duration</th>
            <th scope="col">Status</th>
            <th scope="col" className="cell-action">
              Attendance
            </th>
          </tr>
        </thead>
        <tbody>
          {classes.map((instance) => {
            const minutes = timeToMinutes(instance.end) - timeToMinutes(instance.start);
            const pendingQuiz = instance.quizzes?.some((quiz) => !quiz.done);
            return (
              <tr key={instance.id} className={cx(instance.cancelled && "dashboard-classes__row--cancelled")}>
                <td>
                  <div className="cell-stack">
                    <span className="cell-strong">{formatTime(instance.start)}</span>
                    <span className="cell-stack__sub">until {formatTime(instance.end)}</span>
                  </div>
                </td>
                <td>
                  <CourseCell
                    color={instance.course.color}
                    name={instance.course.name}
                    meta={instance.kind === "makeup" ? "Makeup class" : `${instance.course.code} · ${instance.course.section}`}
                  />
                </td>
                <td className="cell-muted">{instance.room || <span className="cell-empty-dash">—</span>}</td>
                <td className="cell-muted">{minutes} min</td>
                <td>
                  <span className="cell-badges">
                    <StatusBadge status={classStatus(instance, now)} />
                    {pendingQuiz && <StatusBadge status="quiz" />}
                  </span>
                </td>
                <td className="cell-action">
                  {!instance.cancelled && (
                    <AttendanceMarker
                      label={`Attendance for ${instance.course.name}`}
                      value={marks[instance.id]}
                      onChange={(status) => onMark(instance.id, status)}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UpcomingTable({ items, now }) {
  if (items.length === 0) {
    return (
      <div className="data-table-wrapper">
        <EmptyState variant="compact" title="Nothing coming up" description="Exams and deadlines you add will appear here." />
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table data-table--zebra">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Type</th>
            <th scope="col">Due</th>
            <th scope="col" className="cell-action">
              When
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const when = daysAway(item.date, now);
            return (
              <tr key={item.id}>
                <td>
                  <CourseCell color={item.color} name={item.title} meta={item.subtitle} />
                </td>
                <td>
                  <StatusBadge status={item.kind} />
                </td>
                <td>
                  <div className="cell-stack">
                    <span className="cell-strong">{formatDayMonth(item.date)}</span>
                    <span className="cell-stack__sub">{formatTime(toTimeKey(item.date))}</span>
                  </div>
                </td>
                <td className="cell-action">
                  <Badge variant={when.variant} compact>
                    {when.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { schedule, markAttendance } = useSchedule();
  const now = useMemo(() => new Date(), []);
  const requirement = schedule.settings.attendanceRequirement;

  const courses = useMemo(() => getSelectedCourses(schedule), [schedule]);
  const todayClasses = useMemo(() => getClassesOnDate(schedule, courses, now), [schedule, courses, now]);
  const clashes = useMemo(() => findClashes(courses), [courses]);
  const exams = useMemo(() => getExams(schedule, courses), [schedule, courses]);
  const tasks = useMemo(() => getTasksWithCourses(schedule, courses), [schedule, courses]);
  const attendance = useMemo(() => getAttendanceSummary(schedule, courses, requirement), [schedule, courses, requirement]);
  const weekly = useMemo(() => getWeeklyWorkload(schedule, courses, exams, tasks, now), [schedule, courses, exams, tasks, now]);
  const daily = useMemo(() => getDailyWorkload(schedule, courses, exams, tasks, now), [schedule, courses, exams, tasks, now]);
  const hoursByCourse = useMemo(() => getHoursByCourse(courses), [courses]);
  const overall = useMemo(() => getOverallAttendance(attendance), [attendance]);

  const upcoming = useMemo(() => {
    const today = startOfDay(now);
    const examItems = exams.map((exam) => ({
      id: exam.id,
      kind: "exam",
      title: exam.course.name,
      subtitle: `${examTermLabel(exam.term)} exam`,
      color: exam.course.color,
      date: exam.startsAt,
    }));
    const taskItems = tasks
      .filter((task) => !task.done)
      .map((task) => ({
        id: task.id,
        kind: task.type === "quiz" ? "quiz" : "assignment",
        title: task.title,
        subtitle: task.course?.name || "No course",
        color: task.course?.color || "#9ca3af",
        date: task.dueAt,
      }));
    return [...examItems, ...taskItems]
      .filter((item) => item.date >= today)
      .sort((a, b) => a.date - b.date)
      .slice(0, UPCOMING_LIMIT);
  }, [exams, tasks, now]);

  const nextExam = exams.filter((exam) => exam.startsAt >= now).sort((a, b) => a.startsAt - b.startsAt)[0];
  const weekEnd = addDays(now, 7);
  const dueThisWeek = tasks.filter((task) => !task.done && task.dueAt >= now && task.dueAt <= weekEnd);
  const quizzesThisWeek = dueThisWeek.filter((task) => task.type === "quiz").length;
  const lowest = getLowestAttendance(attendance);
  const activeClasses = todayClasses.filter((instance) => !instance.cancelled);
  const daysToExam = nextExam ? differenceInDays(startOfDay(nextExam.startsAt), startOfDay(now)) : null;
  const firstName = user?.name?.split(" ")[0] || "there";
  const thisWeek = weekly.find((week) => week.current) || { hours: 0, due: 0 };

  const workloadMetrics = [
    { id: "due", label: "Exams & deadlines", value: thisWeek.due, detail: "This week" },
    { id: "hours", label: "Class hours", value: `${thisWeek.hours} h`, detail: "This week" },
  ];

  const summary = [
    activeClasses.length
      ? `${plural(activeClasses.length, "class", "classes")} today, first at ${formatTime(activeClasses[0].start)}.`
      : "No classes today.",
    quizzesThisWeek ? `${plural(quizzesThisWeek, "quiz", "quizzes")} this week.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const header = (actions) => (
    <header className="dashboard-header">
      <div className="dashboard-header__text">
        <span className="dashboard-header__date">{formatLongDate(now)}</span>
        <h1 className="dashboard-header__title">
          {getGreeting(now)}, {firstName}
        </h1>
        {actions && <p className="dashboard-header__summary">{summary}</p>}
      </div>
      {actions && <div className="dashboard-header__actions">{actions}</div>}
    </header>
  );

  if (courses.length === 0) {
    return (
      <>
        {header(null)}
        <Panel>
          <EmptyState
            icon="spreadsheet"
            title="Add your timetable to get started"
            description="Upload the timetable Excel file and select your sections. Your classes will appear here."
            action={
              <Button to="/app/timetable" variant="primary">
                Upload timetable
              </Button>
            }
          />
        </Panel>
      </>
    );
  }

  return (
    <div className="dashboard">
      {header(
        <>
          <Button to="/app/timetable">Upload file</Button>
          <Button to="/app/tasks" variant="primary">
            Add task
          </Button>
        </>
      )}

      <SemesterNotice />

      {clashes.length > 0 && (
        <Notice variant="warning" title="Schedule clash." action={<Link to="/app/timetable">Resolve</Link>}>
          {describeClash(clashes[0])}
          {clashes.length > 1 && ` and ${clashes.length - 1} more.`}
        </Notice>
      )}

      <div className="kpi-grid">
        <KpiCard
          label="Classes today"
          value={activeClasses.length}
          detail={activeClasses.length ? `First at ${formatTime(activeClasses[0].start)}` : "No classes scheduled"}
        />
        <KpiCard
          label="Next exam"
          value={nextExam ? (daysToExam === 0 ? "Today" : `${daysToExam} ${daysToExam === 1 ? "day" : "days"}`) : "None"}
          detail={nextExam ? `${nextExam.course.name}, ${formatDayMonth(nextExam.startsAt)}` : "Upload a date sheet"}
        />
        <KpiCard
          label="Due this week"
          value={dueThisWeek.length}
          detail={`${plural(dueThisWeek.length - quizzesThisWeek, "assignment")}, ${plural(quizzesThisWeek, "quiz", "quizzes")}`}
        />
        <KpiCard
          label="Lowest attendance"
          value={lowest ? `${lowest.percentage}%` : "–"}
          detail={lowest ? lowest.course.name : "No courses yet"}
          tone={lowest && lowest.risk !== "ok" ? lowest.risk : undefined}
        />
      </div>

      <div className="dashboard-row dashboard-row--stretch">
        <WorkloadChart weekly={weekly} daily={daily} metrics={workloadMetrics} />
        <AttendanceGauge summary={attendance} overall={overall} requirement={requirement} />
      </div>

      <TableSection title="Today's classes" link={{ to: "/app/calendar", label: "Open calendar" }}>
        <TodayClasses classes={todayClasses} marks={schedule.attendance.marks} now={now} onMark={markAttendance} />
      </TableSection>

      <div className="dashboard-row">
        <TableSection title="Coming up" link={{ to: "/app/tasks", label: "View all" }}>
          <UpcomingTable items={upcoming} now={now} />
        </TableSection>
        <CourseHoursChart items={hoursByCourse} />
      </div>
    </div>
  );
}
