import { useMemo } from "react";
import { Link } from "react-router-dom";
import SemesterNotice from "../components/app/SemesterNotice.jsx";
import CourseCell from "../components/app/CourseCell.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Icon from "../components/ui/Icon.jsx";
import Notice from "../components/ui/Notice.jsx";
import Panel from "../components/ui/Panel.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSchedule } from "../hooks/useSchedule.js";
import { getAttendanceSummary, getLowestAttendance } from "../utils/attendance.js";
import { startOfWeek, weekdayIndexes } from "../utils/calendarLayout.js";
import { describeClash, findClashes } from "../utils/clashes.js";
import { cx } from "../utils/cx.js";
import {
  SHORT_DAY_NAMES,
  addDays,
  combineDateTime,
  differenceInDays,
  formatDayMonth,
  formatLongDate,
  formatTime,
  getGreeting,
  isSameDay,
  startOfDay,
  timeToMinutes,
  toDateKey,
  toTimeKey,
} from "../utils/date.js";
import { examTermLabel } from "../utils/examTerms.js";
import { getClassInstances, getClassesOnDate, getExams, getSelectedCourses, getTasksWithCourses } from "../utils/schedule.js";
import "../styles/pages/dashboard.css";

const UPCOMING_LIMIT = 5;
const ATTENDANCE_LIMIT = 4;
const RISK_STATUS = { ok: "safe", warning: "warning", critical: "critical" };

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

function KpiCard({ icon, label, value, detail, tone }) {
  return (
    <div className="kpi-card">
      <div className={cx("kpi-card__icon", tone && `kpi-card__icon--${tone}`)}>
        <Icon name={icon} size={20} strokeWidth={2} />
      </div>
      <div className="kpi-card__text">
        <span className="kpi-card__label">{label}</span>
        <span className="kpi-card__value">{value}</span>
        {detail && <span className="kpi-card__detail">{detail}</span>}
      </div>
    </div>
  );
}

function TodayClasses({ classes, marks, now, onToggle }) {
  if (classes.length === 0) {
    return (
      <EmptyState
        variant="compact"
        title="No classes today"
        description="Enjoy the free day, or catch up on assignments."
      />
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table dashboard-classes">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Course</th>
            <th scope="col">Room</th>
            <th scope="col">Status</th>
            <th scope="col" className="cell-action">
              Attendance
            </th>
          </tr>
        </thead>
        <tbody>
          {classes.map((instance) => {
            const present = marks[instance.id] === "present";
            const minutes = timeToMinutes(instance.end) - timeToMinutes(instance.start);
            const pendingQuiz = instance.quizzes?.some((quiz) => !quiz.done);
            return (
              <tr key={instance.id} className={cx(instance.cancelled && "dashboard-classes__row--cancelled")}>
                <td>
                  <div className="cell-stack">
                    <span className="cell-strong">{formatTime(instance.start)}</span>
                    <span className="cell-stack__sub">
                      until {formatTime(instance.end)} · {minutes} min
                    </span>
                  </div>
                </td>
                <td>
                  <CourseCell
                    color={instance.course.color}
                    name={instance.course.name}
                    meta={instance.kind === "makeup" ? "Makeup class" : `Section ${instance.course.section}`}
                  />
                </td>
                <td className="cell-muted">{instance.room || <span className="cell-empty-dash">—</span>}</td>
                <td>
                  <span className="cell-badges">
                    <StatusBadge status={classStatus(instance, now)} />
                    {pendingQuiz && <StatusBadge status="quiz" />}
                  </span>
                </td>
                <td className="cell-action">
                  {!instance.cancelled && (
                    <button
                      type="button"
                      className={cx("attendance-toggle", present && "attendance-toggle--on")}
                      aria-pressed={present}
                      onClick={() => onToggle(instance.id, present)}
                    >
                      <Icon name="check" size={14} strokeWidth={2.5} />
                      {present ? "Present" : "Mark present"}
                    </button>
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

function WeekGlance({ days, now }) {
  return (
    <div className="week-glance">
      {days.map((day) => (
        <div key={day.key} className={cx("week-glance__day", isSameDay(day.date, now) && "week-glance__day--today")}>
          <div className="week-glance__head">
            <span className="week-glance__name">{SHORT_DAY_NAMES[day.date.getDay()]}</span>
            <span className="week-glance__date">{day.date.getDate()}</span>
          </div>
          <span className="week-glance__count">{day.classes}</span>
          <span className="week-glance__label">{day.classes === 1 ? "class" : "classes"}</span>
          <div className="week-glance__marks">
            {day.exams > 0 && <Badge variant="default" compact>{plural(day.exams, "exam")}</Badge>}
            {day.quizzes > 0 && <Badge variant="indigo" compact>{plural(day.quizzes, "quiz", "quizzes")}</Badge>}
            {day.deadlines > 0 && <Badge variant="warning" compact>{plural(day.deadlines, "deadline")}</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
}

function UpcomingList({ items, now }) {
  if (items.length === 0) {
    return <EmptyState variant="compact" title="Nothing coming up" description="Exams and deadlines you add will appear here." />;
  }

  return (
    <ul className="upcoming-list">
      {items.map((item) => {
        const when = daysAway(item.date, now);
        return (
          <li key={item.id} className="upcoming-list__item">
            <span className={cx("upcoming-list__icon", `upcoming-list__icon--${item.kind}`)} aria-hidden="true">
              <Icon name={item.kind === "exam" ? "datesheets" : "tasks"} size={16} strokeWidth={2} />
            </span>
            <span className="upcoming-list__text">
              <span className="upcoming-list__title">{item.title}</span>
              <span className="upcoming-list__detail">
                {item.subtitle} · {formatDayMonth(item.date)}, {formatTime(toTimeKey(item.date))}
              </span>
            </span>
            <Badge variant={when.variant} compact>
              {when.label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

function AttendanceList({ items }) {
  return (
    <ul className="attendance-list">
      {items.map((item) => (
        <li key={item.course.code} className="attendance-list__item">
          <div className="attendance-list__row">
            <span className="attendance-list__name">{item.course.name}</span>
            <span className={cx("attendance-list__value", `attendance-list__value--${item.risk}`)}>{item.percentage}%</span>
          </div>
          <div className="attendance-list__bar" aria-hidden="true">
            <span
              className={`attendance-list__fill attendance-list__fill--${item.risk}`}
              style={{ width: `${Math.min(100, item.percentage)}%` }}
            />
          </div>
          <div className="attendance-list__row">
            <span className="attendance-list__meta">
              {item.attended} of {item.held} attended
            </span>
            <StatusBadge status={RISK_STATUS[item.risk]} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { schedule, markAttendance } = useSchedule();
  const now = useMemo(() => new Date(), []);

  const courses = useMemo(() => getSelectedCourses(schedule), [schedule]);
  const todayClasses = useMemo(() => getClassesOnDate(schedule, courses, now), [schedule, courses, now]);
  const clashes = useMemo(() => findClashes(courses), [courses]);
  const exams = useMemo(() => getExams(schedule, courses), [schedule, courses]);
  const tasks = useMemo(() => getTasksWithCourses(schedule, courses), [schedule, courses]);
  const attendance = useMemo(
    () => getAttendanceSummary(schedule, courses, schedule.settings.attendanceRequirement),
    [schedule, courses]
  );

  const upcoming = useMemo(() => {
    const today = startOfDay(now);
    const examItems = exams.map((exam) => ({
      id: exam.id,
      kind: "exam",
      title: exam.course.name,
      subtitle: `${examTermLabel(exam.term)} exam`,
      date: exam.startsAt,
    }));
    const taskItems = tasks
      .filter((task) => !task.done)
      .map((task) => ({
        id: task.id,
        kind: task.type,
        title: task.title,
        subtitle: task.course?.name || (task.type === "quiz" ? "Quiz" : "Assignment"),
        date: task.dueAt,
      }));
    return [...examItems, ...taskItems]
      .filter((item) => item.date >= today)
      .sort((a, b) => a.date - b.date)
      .slice(0, UPCOMING_LIMIT);
  }, [exams, tasks, now]);

  const week = useMemo(() => {
    const monday = startOfWeek(now);
    const days = weekdayIndexes(schedule.settings.showSaturday).map((weekday) => addDays(monday, weekday - 1));
    const instances = getClassInstances(schedule, courses, days[0], days[days.length - 1]);
    return days.map((date) => {
      const key = toDateKey(date);
      const dayTasks = tasks.filter((task) => !task.done && toDateKey(task.dueAt) === key);
      return {
        key,
        date,
        classes: instances.filter((instance) => instance.dateKey === key && !instance.cancelled).length,
        exams: exams.filter((exam) => exam.date === key).length,
        quizzes: dayTasks.filter((task) => task.type === "quiz").length,
        deadlines: dayTasks.filter((task) => task.type !== "quiz").length,
      };
    });
  }, [schedule, courses, exams, tasks, now]);

  const nextExam = exams.filter((exam) => exam.startsAt >= now).sort((a, b) => a.startsAt - b.startsAt)[0];
  const weekEnd = addDays(now, 7);
  const dueThisWeek = tasks.filter((task) => !task.done && task.dueAt >= now && task.dueAt <= weekEnd);
  const quizzesThisWeek = dueThisWeek.filter((task) => task.type === "quiz").length;
  const lowest = getLowestAttendance(attendance);
  const activeClasses = todayClasses.filter((instance) => !instance.cancelled);
  const daysToExam = nextExam ? differenceInDays(startOfDay(nextExam.startsAt), startOfDay(now)) : null;
  const firstName = user?.name?.split(" ")[0] || "there";
  const lowestCourses = [...attendance].sort((a, b) => a.percentage - b.percentage).slice(0, ATTENDANCE_LIMIT);

  const summary = [
    activeClasses.length
      ? `${plural(activeClasses.length, "class", "classes")} today, first at ${formatTime(activeClasses[0].start)}.`
      : "No classes today.",
    quizzesThisWeek ? `${plural(quizzesThisWeek, "quiz", "quizzes")} this week.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleToggle = (id, present) => markAttendance(id, present ? null : "present");

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
          icon="calendar"
          label="Classes today"
          value={activeClasses.length}
          detail={activeClasses.length ? `First at ${formatTime(activeClasses[0].start)}` : "No classes scheduled"}
        />
        <KpiCard
          icon="datesheets"
          label="Next exam"
          value={nextExam ? (daysToExam === 0 ? "Today" : `${daysToExam} ${daysToExam === 1 ? "day" : "days"}`) : "None"}
          detail={nextExam ? `${nextExam.course.name}, ${formatDayMonth(nextExam.startsAt)}` : "Upload a date sheet"}
        />
        <KpiCard
          icon="tasks"
          label="Due this week"
          value={dueThisWeek.length}
          detail={`${plural(dueThisWeek.length - quizzesThisWeek, "assignment")}, ${plural(quizzesThisWeek, "quiz", "quizzes")}`}
        />
        <KpiCard
          icon="attendance"
          label="Lowest attendance"
          value={lowest ? `${lowest.percentage}%` : "–"}
          detail={lowest ? lowest.course.name : "No courses yet"}
          tone={lowest && lowest.risk !== "ok" ? "warning" : undefined}
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-grid__main">
          <section className="dash-card">
            <header className="dash-card__header">
              <h2 className="dash-card__title">Today&apos;s classes</h2>
              <Link to="/app/calendar" className="dash-card__link">
                Open calendar
              </Link>
            </header>
            <TodayClasses classes={todayClasses} marks={schedule.attendance.marks} now={now} onToggle={handleToggle} />
          </section>

          <section className="dash-card">
            <header className="dash-card__header">
              <h2 className="dash-card__title">This week</h2>
              <Link to="/app/calendar" className="dash-card__link">
                Week view
              </Link>
            </header>
            <WeekGlance days={week} now={now} />
          </section>
        </div>

        <div className="dashboard-grid__side">
          <section className="dash-card">
            <header className="dash-card__header">
              <h2 className="dash-card__title">Upcoming</h2>
              <Link to="/app/tasks" className="dash-card__link">
                View all
              </Link>
            </header>
            <UpcomingList items={upcoming} now={now} />
          </section>

          <section className="dash-card">
            <header className="dash-card__header">
              <h2 className="dash-card__title">Attendance</h2>
              <Link to="/app/attendance" className="dash-card__link">
                Details
              </Link>
            </header>
            <AttendanceList items={lowestCourses} />
          </section>
        </div>
      </div>
    </div>
  );
}
