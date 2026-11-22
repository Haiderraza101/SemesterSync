import { useMemo } from "react";
import SemesterNotice from "../components/app/SemesterNotice.jsx";
import AttendanceMarker from "../components/app/AttendanceMarker.jsx";
import CourseCell from "../components/app/CourseCell.jsx";
import ProgressBar from "../components/app/ProgressBar.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import KpiCard, { KpiGrid } from "../components/ui/KpiCard.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import SelectField from "../components/ui/SelectField.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { ATTENDANCE_OPTIONS, LATES_PER_ABSENCE, getAttendanceSummary } from "../utils/attendance.js";
import { getOverallAttendance } from "../utils/dashboardStats.js";
import { formatLongDate, formatTimeRange } from "../utils/date.js";
import { getClassesOnDate, getSelectedCourses } from "../utils/schedule.js";

const RISK_STATUS = {
  ok: "safe",
  warning: "warning",
  critical: "critical",
};

function TodayMarking({ classes, marks, onMark }) {
  if (classes.length === 0) {
    return <EmptyState variant="compact" icon="calendar" title="No classes to mark today" />;
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
          <AttendanceMarker
            label={`Attendance for ${instance.course.name}`}
            value={marks[instance.id]}
            onChange={(status) => onMark(instance.id, status)}
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
  const overall = useMemo(() => getOverallAttendance(summary), [summary]);
  const lates = summary.reduce((total, item) => total + item.late, 0);
  const lateAbsences = summary.reduce((total, item) => total + item.lateAbsences, 0);
  const atRisk = summary.filter((item) => item.risk !== "ok");
  const overallTone =
    overall.percentage === null ? undefined : overall.percentage < requirement ? "critical" : overall.percentage < requirement + 5 ? "warning" : "success";
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

      <SemesterNotice />

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
          <KpiGrid>
            <KpiCard
              label="Overall attendance"
              value={overall.percentage === null ? "–" : `${overall.percentage}%`}
              progress={overall.percentage ?? 0}
              tone={overallTone}
              detail={`${requirement}% required`}
            />
            <KpiCard
              label="Classes attended"
              value={overall.attended}
              unit={`of ${overall.held}`}
              detail={overall.held ? `${overall.held - overall.attended} missed so far` : "No classes recorded yet"}
            />
            <KpiCard
              label="Late marks"
              value={lates}
              detail={lateAbsences ? `Counted as ${lateAbsences} ${lateAbsences === 1 ? "absence" : "absences"}` : `Every ${LATES_PER_ABSENCE} lates count as one absence`}
              tone={lateAbsences ? "warning" : undefined}
            />
            <KpiCard
              label="Courses at risk"
              value={atRisk.length}
              unit={`of ${summary.length}`}
              detail={atRisk.length ? atRisk.map((item) => item.course.name).join(", ") : "Every course is on track"}
              tone={atRisk.length ? "warning" : "success"}
            />
          </KpiGrid>

          <Panel title="Mark today" description={formatLongDate(now)} flush>
            <TodayMarking classes={todayClasses} marks={schedule.attendance.marks} onMark={markAttendance} />
          </Panel>

          <Panel
            title="By course"
            description={`Can still miss is how many more classes you can skip and stay at or above ${requirement}%. Every ${LATES_PER_ABSENCE} lates count as one absence.`}
            flush
          >
            <div className="data-table-wrapper">
              <table className="data-table data-table--zebra attendance-table">
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
                      Late
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
                      <td className="cell-numeric cell-muted">{item.held}</td>
                      <td className="cell-numeric cell-muted">{item.attended}</td>
                      <td className="cell-numeric cell-muted">{item.late}</td>
                      <td className="cell-numeric cell-muted">
                        {item.absent}
                        {item.lateAbsences > 0 && <span className="attendance-table__note"> incl. {item.lateAbsences} from lates</span>}
                      </td>
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
                        <StatusBadge
                          status={RISK_STATUS[item.risk]}
                          label={
                            item.canMiss === 0
                              ? "None left"
                              : `${item.canMiss} ${item.canMiss === 1 ? "class" : "classes"}`
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
