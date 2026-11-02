import { useMemo, useRef, useState } from "react";
import Button from "../components/ui/Button.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import SegmentedControl from "../components/ui/SegmentedControl.jsx";
import SelectField from "../components/ui/SelectField.jsx";
import { SEMESTER } from "../config.js";
import { useAuth } from "../hooks/useAuth.js";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { cx } from "../utils/cx.js";
import { DAY_NAMES, formatShortTimeRange } from "../utils/date.js";
import { getErrorMessage } from "../utils/errors.js";
import { exportTimetable } from "../utils/exportTimetable.js";
import { getSelectedCourses } from "../utils/schedule.js";
import { buildTimetableGrid } from "../utils/timetableGrid.js";
import "../styles/pages/export.css";

const FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "png", label: "PNG" },
];

const ORIENTATION_OPTIONS = [
  { value: "landscape", label: "A4 landscape" },
  { value: "portrait", label: "A4 portrait" },
];

function TimetablePreview({ previewRef, user, rows, days, showRooms, shaded }) {
  return (
    <div ref={previewRef} className="export-sheet">
      <div className="export-sheet__header">
        <div>
          <strong className="export-sheet__title">Weekly timetable, {SEMESTER.name}</strong>
          <span className="export-sheet__meta">
            {user.name} · {user.rollNumber} · {user.section}
          </span>
        </div>
        <span className="export-sheet__brand">SemesterSync</span>
      </div>
      <table className="export-sheet__table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            {days.map((day) => (
              <th key={day} scope="col">
                {DAY_NAMES[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{formatShortTimeRange(row.start, row.end)}</th>
              {row.cells.map((cell) => (
                <td key={cell.day} className={cx(shaded && cell.courses.length > 0 && "export-sheet__cell--filled")}>
                  {cell.courses.map((course) => (
                    <div key={course.code} className="export-sheet__entry">
                      <strong>{course.name}</strong>
                      {showRooms && <span>{course.room}</span>}
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Export() {
  const { user } = useAuth();
  const { schedule } = useSchedule();
  const { notify } = useToast();
  const previewRef = useRef(null);
  const [format, setFormat] = useState("pdf");
  const [orientation, setOrientation] = useState("landscape");
  const [showRooms, setShowRooms] = useState(true);
  const [shaded, setShaded] = useState(true);
  const [exporting, setExporting] = useState(false);

  const courses = useMemo(() => getSelectedCourses(schedule), [schedule]);
  const days = useMemo(() => (schedule.settings.showSaturday ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5]), [schedule.settings.showSaturday]);
  const rows = useMemo(() => buildTimetableGrid(courses, days), [courses, days]);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      await exportTimetable(previewRef.current, {
        format,
        orientation,
        fileName: `timetable-${SEMESTER.name.toLowerCase().replace(/\s+/g, "-")}`,
      });
      notify(`Timetable downloaded as ${format.toUpperCase()}.`);
    } catch (error) {
      notify(getErrorMessage(error, "The export failed. Please try again."), "danger");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader title="Export timetable" description="Download your weekly timetable to print or keep on your phone." />

      {courses.length === 0 ? (
        <Panel>
          <EmptyState
            icon="export"
            title="Nothing to export yet"
            description="Select your sections on the timetable page first."
            action={
              <Button to="/app/timetable" variant="primary">
                Go to timetable
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="page-grid">
          <div className="page-grid__main export-stage">
            <TimetablePreview previewRef={previewRef} user={user} rows={rows} days={days} showRooms={showRooms} shaded={shaded} />
          </div>
          <div className="page-grid__side">
            <Panel as="div" title="Options">
              <div className="modal__form">
                <fieldset>
                  <legend className="field__label export-options__legend">Format</legend>
                  <SegmentedControl label="Format" options={FORMAT_OPTIONS} value={format} onChange={setFormat} block />
                </fieldset>
                {format === "pdf" && (
                  <SelectField
                    label="Page size"
                    options={ORIENTATION_OPTIONS}
                    value={orientation}
                    onChange={(event) => setOrientation(event.target.value)}
                  />
                )}
                <fieldset className="share-panel__options">
                  <legend className="field__label export-options__legend">Include</legend>
                  <Checkbox label="Room numbers" checked={showRooms} onChange={() => setShowRooms((value) => !value)} />
                  <Checkbox label="Shade class cells" checked={shaded} onChange={() => setShaded((value) => !value)} />
                </fieldset>
                <Button variant="primary" block disabled={exporting} onClick={handleDownload}>
                  {exporting ? "Preparing file…" : `Download ${format.toUpperCase()}`}
                </Button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
