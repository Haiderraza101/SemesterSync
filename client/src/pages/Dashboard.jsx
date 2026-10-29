import { useMemo } from "react";
import { Link } from "react-router-dom";
import CourseCell from "../components/app/CourseCell.jsx";
import ProgressBar from "../components/app/ProgressBar.jsx";
import StatGroup from "../components/app/StatGroup.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSchedule } from "../hooks/useSchedule.js";
import { getAttendanceSummary, getLowestAttendance } from "../utils/attendance.js";
import { describeClash, findClashes } from "../utils/clashes.js";
import {
  SHORT_DAY_NAMES,
  addDays,
  combineDateTime,
  differenceInDays,
  formatDayMonth,
  formatLongDate,
  formatTime,
  formatTimeRange,
  getGreeting,
} from "../utils/date.js";
import { getClassesOnDate, getExams, getSelectedCourses, getTasksWithCourses, getUpcomingItems } from "../utils/schedule.js";
import "../styles/pages/dashboard.css";

const STATUS_BADGES = {
  cancelled: { label: "Cancelled", variant: "muted" },
  completed: { label: "Completed", variant: "muted" },
  live: { label: "In progress", variant: "info" },
  upcoming: { label: "Upcoming", variant: "neutral" },
};

function getClassStatus(instance, now) {
  if (instance.cancelled) return "cancelled";
  const startsAt = combineDateTime(instance.dateKey, instance.start);
  const endsAt = combineDateTime(instance.dateKey, instance.end);
  if (now >= endsAt) return "completed";
  if (now >= startsAt) return "live";
  return "upcoming";
}

function TodayClasses({ classes, marks, now, onToggle }) {
  if (classes.length === 0) {
    return <EmptyState icon="calendar" title="No classes today" description="Enjoy the free day, or catch up on assignments." />;
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
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
            const status = STATUS_BADGES[getClassStatus(instance, now)];
            const present = marks[instance.id] === "present";
            return (
              <tr key={instance.id}>
                <td className="cell-nowrap">{formatTimeRange(instance.start, instance.end)}</td>
                <td>
                  <CourseCell
                    color={instance.course.color}
                    name={instance.course.name}
                    meta={instance.kind === "makeup" ? "Makeup class" : `Section ${instance.course.section}`}
                  />
                </td>
                <td>{instance.room}</td>
                <td>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="cell-action">
                  {!instance.cancelled && (
                    <Button size="sm" variant={present ? "primary" : "secondary"} aria-pressed={present} onClick={() => onToggle(instance.id, present)}>
                      {present ? "Present" : "Mark present"}
                    </Button>
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

function UpcomingList({ items }) {
  if (items.length === 0) {
    return <EmptyState icon="tasks" title="Nothing coming up" description="Exams and deadlines you add will appear here." />;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} className="upcoming-list__item">
          <div className="upcoming-list__date">
            {SHORT_DAY_NAMES[item.date.getDay()]}
            <span className="upcoming-list__day">{item.date.getDate()}</span>
          </div>
          <div className="upcoming-list__text">
            <span className="upcoming-list__title">{item.title}</span>
            <span className="upcoming-list__detail">
              {item.detail}, {formatTime(`${item.date.getHours()}:${item.date.getMinutes()}`)}
            </span>
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
  const upcoming = useMemo(() => getUpcomingItems(schedule, courses, now), [schedule, courses, now]);
  const attendance = useMemo(
    () => getAttendanceSummary(schedule, courses, schedule.settings.attendanceRequirement),
    [schedule, courses]
  );

  const nextExam = useMemo(
    () => getExams(schedule, courses).filter((exam) => exam.startsAt >= now).sort((a, b) => a.startsAt - b.startsAt)[0],
    [schedule, courses, now]
  );

  const dueThisWeek = useMemo(() => {
    const weekEnd = addDays(now, 7);
    return getTasksWithCourses(schedule, courses).filter((task) => !task.done && task.dueAt >= now && task.dueAt <= weekEnd);
  }, [schedule, courses, now]);

  const lowest = getLowestAttendance(attendance);
  const activeClasses = todayClasses.filter((instance) => !instance.cancelled);
  const daysToExam = nextExam ? differenceInDays(nextExam.startsAt, now) : null;
  const quizzes = dueThisWeek.filter((task) => task.type === "quiz").length;

  const stats = [
    {
      label: "Classes today",
      value: activeClasses.length,
      detail: activeClasses.length ? `First at ${formatTime(activeClasses[0].start)}` : "No classes scheduled",
    },
    {
      label: "Next exam",
      value: nextExam ? (daysToExam === 0 ? "Today" : `${daysToExam} ${daysToExam === 1 ? "day" : "days"}`) : "None",
      detail: nextExam ? `${nextExam.course.name}, ${formatDayMonth(nextExam.startsAt)}` : "Upload a date sheet",
    },
    {
      label: "Due this week",
      value: dueThisWeek.length,
      detail: `${dueThisWeek.length - quizzes} ${dueThisWeek.length - quizzes === 1 ? "assignment" : "assignments"}, ${quizzes} ${quizzes === 1 ? "quiz" : "quizzes"}`,
    },
    {
      label: "Lowest attendance",
      value: lowest ? `${lowest.percentage}%` : "–",
      detail: lowest ? lowest.course.name : "No courses yet",
      tone: lowest && lowest.risk !== "ok" ? "warning" : undefined,
    },
  ];

  const lowestThree = [...attendance].sort((a, b) => a.percentage - b.percentage).slice(0, 3);
  const firstName = user?.name?.split(" ")[0] || "there";

  const handleToggle = (id, present) => markAttendance(id, present ? null : "present");

  if (courses.length === 0) {
    return (
      <>
        <PageHeader eyebrow={formatLongDate(now)} title={`${getGreeting(now)}, ${firstName}`} />
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
    <>
      <PageHeader
        eyebrow={formatLongDate(now)}
        title={`${getGreeting(now)}, ${firstName}`}
        actions={
          <>
            <Button to="/app/timetable">Upload file</Button>
            <Button to="/app/tasks" variant="primary">
              Add task
            </Button>
          </>
        }
      />

      {clashes.length > 0 && (
        <Notice variant="warning" title="Schedule clash." action={<Link to="/app/timetable">Resolve</Link>}>
          {describeClash(clashes[0])}
          {clashes.length > 1 && ` and ${clashes.length - 1} more.`}
        </Notice>
      )}

      <StatGroup stats={stats} />

      <div className="page-grid">
        <Panel className="page-grid__main" title="Today's classes" action={<Link to="/app/calendar">Open calendar</Link>} flush>
          <TodayClasses classes={todayClasses} marks={schedule.attendance.marks} now={now} onToggle={handleToggle} />
        </Panel>

        <div className="page-grid__side">
          <Panel title="Upcoming" action={<Link to="/app/tasks">View all</Link>} flush>
            <UpcomingList items={upcoming} />
          </Panel>
          <Panel title="Attendance" action={<Link to="/app/attendance">Details</Link>}>
            <ul className="attendance-mini">
              {lowestThree.map((item) => (
                <li key={item.course.code} className="attendance-mini__item">
                  <div className="attendance-mini__row">
                    <span>{item.course.name}</span>
                    <span className={`attendance-mini__value attendance-mini__value--${item.risk}`}>{item.percentage}%</span>
                  </div>
                  <ProgressBar value={item.percentage} label={`${item.course.name} attendance`} tone={item.risk === "ok" ? "default" : "warning"} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
