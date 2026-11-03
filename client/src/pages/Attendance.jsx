import { useMemo } from "react";
import CourseCell from "../components/app/CourseCell.jsx";
import ProgressBar from "../components/app/ProgressBar.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import SegmentedControl from "../components/ui/SegmentedControl.jsx";
import SelectField from "../components/ui/SelectField.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { ATTENDANCE_OPTIONS, getAttendanceSummary } from "../utils/attendance.js";
import { formatLongDate, formatTimeRange } from "../utils/date.js";
import { getClassesOnDate, getSelectedCourses } from "../utils/schedule.js";

const MARK_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
];

const RISK_BADGES = {
  ok: "neutral",
  warning: "warning",
  critical: "danger",
};

function TodayMarking({ classes, marks, onMark }) {
  if (classes.length === 0) {
    return <EmptyState icon="calendar" title="No classes to mark today" />;
  }

  return (
    <ul>
      {classes.map((instance) => (
        <li key={instance.id} className="mark-row">
          <CourseCell
            color={instance.course.color}
            name={instance.course.name}
            meta={`${formatTimeRange(instance.start, instance.end)}, ${instance.room}`}
          />
          <SegmentedControl
            label={`Attendance for ${instance.course.name}`}
            options={MARK_OPTIONS}
            value={marks[instance.id]}
            onChange={(status) => onMark(instance.id, marks[instance.id] === status ? null : status)}
          />
        </li>
      ))}
    </ul>
  );
}

export default function Attendance() {
  const { schedule, markAttendance, updateSettings } = useSchedule();
  const requirement = schedule.settings.attendanceRequirement;
  const now = useMemo(() => new Date(), []);

  const courses = useMemo(() => getSelectedCourses(schedule), [schedule]);
  const summary = useMemo(() => getAttendanceSummary(schedule, courses, requirement), [schedule, courses, requirement]);
  const todayClasses = useMemo(
    () => getClassesOnDate(schedule, courses, now).filter((instance) => !instance.cancelled),
    [schedule, courses, now]
  );

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`Minimum required attendance is ${requirement}%. Absences beyond the limit put you at risk of being barred from exams.`}
        actions={
          <SelectField
            label="Required"
            inline
            options={ATTENDANCE_OPTIONS}
            value={requirement}
            onChange={(event) => updateSettings({ attendanceRequirement: Number(event.target.value) })}
          />
        }
      />

      {courses.length === 0 ? (
        <Panel>
          <EmptyState
            icon="attendance"
            title="No courses to track"
            description="Select your sections on the timetable page to start tracking attendance."
            action={
              <Button to="/app/timetable" variant="primary">
                Go to timetable
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <Panel title={`Mark today, ${formatLongDate(now)}`} flush>
            <TodayMarking classes={todayClasses} marks={schedule.attendance.marks} onMark={markAttendance} />
          </Panel>

          <Panel flush>
            <div className="data-table-wrapper">
              <table className="data-table attendance-table">
                <thead>
                  <tr>
                    <th scope="col">Course</th>
                    <th scope="col" className="cell-numeric">
                      Held
                    </th>
                    <th scope="col" className="cell-numeric">
                      Attended
                    </th>
                    <th scope="col" className="cell-numeric">
                      Absent
                    </th>
                    <th scope="col">Attendance</th>
                    <th scope="col">Can still miss</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((item) => (
                    <tr key={item.course.code}>
                      <td>
                        <CourseCell
                          color={item.course.color}
                          name={item.course.name}
                          meta={`Section ${item.course.section}`}
                        />
                      </td>
                      <td className="cell-numeric">{item.held}</td>
                      <td className="cell-numeric">{item.attended}</td>
                      <td className="cell-numeric">{item.absent}</td>
                      <td>
                        <div className="attendance-table__meter">
                          <ProgressBar
                            value={item.percentage}
                            label={`${item.course.name} attendance`}
                            tone={item.risk === "ok" ? "default" : item.risk}
                          />
                          <span className={`attendance-table__percent attendance-table__percent--${item.risk}`}>
                            {item.percentage}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={RISK_BADGES[item.risk]}>
                          {item.canMiss === 0
                            ? "None left"
                            : `${item.canMiss} ${item.canMiss === 1 ? "class" : "classes"}`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <p className="text-muted">
            Can still miss is the number of classes you can skip for the rest of the semester and stay at or above{" "}
            {requirement}%.
          </p>
        </>
      )}
    </>
  );
}
