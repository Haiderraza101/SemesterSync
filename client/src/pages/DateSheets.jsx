import { useMemo, useState } from "react";
import CourseCell from "../components/app/CourseCell.jsx";
import FileDropzone from "../components/app/FileDropzone.jsx";
import Button from "../components/ui/Button.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import SelectField from "../components/ui/SelectField.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { scheduleService } from "../services/scheduleService.js";
import { formatShortDate, formatTimeRange, parseDateKey } from "../utils/date.js";
import { getErrorMessage } from "../utils/errors.js";
import { validateSpreadsheet } from "../utils/files.js";
import { EXAM_REMINDER_OPTIONS } from "../utils/reminders.js";
import { getSelectedCourses } from "../utils/schedule.js";

const TERMS = [
  { value: "midterm", label: "Midterm exams" },
  { value: "final", label: "Final exams" },
];

function ExamTable({ exams, courseIndex, editable, onToggle, onReminderChange }) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table" style={{ minWidth: 760 }}>
        <thead>
          <tr>
            {editable && (
              <th scope="col">
                <span className="sr-only">Include</span>
              </th>
            )}
            <th scope="col">Course</th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Venue</th>
            <th scope="col">Reminder</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => {
            const course = courseIndex.get(exam.code);
            const reminderLabel = EXAM_REMINDER_OPTIONS.find((option) => option.value === exam.reminder)?.label;
            return (
              <tr key={exam.code}>
                {editable && (
                  <td>
                    <Checkbox label={`Include ${course.name}`} hideLabel checked={exam.included} onChange={() => onToggle(exam.code)} />
                  </td>
                )}
                <td>
                  <CourseCell color={course.color} name={course.name} meta={exam.code} />
                </td>
                <td className="cell-nowrap cell-primary">{formatShortDate(parseDateKey(exam.date))}</td>
                <td className="cell-nowrap">{formatTimeRange(exam.start, exam.end)}</td>
                <td>{exam.venue}</td>
                <td>
                  {editable ? (
                    <SelectField
                      label={`Reminder for ${course.name}`}
                      hideLabel
                      options={EXAM_REMINDER_OPTIONS}
                      value={exam.reminder}
                      onChange={(event) => onReminderChange(exam.code, event.target.value)}
                    />
                  ) : (
                    reminderLabel
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

export default function DateSheets() {
  const { schedule, setDateSheet } = useSchedule();
  const { notify } = useToast();
  const [term, setTerm] = useState("midterm");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null);
  const [defaultReminder, setDefaultReminder] = useState(schedule.settings.examReminder);

  const courses = useMemo(() => getSelectedCourses(schedule), [schedule]);
  const courseIndex = useMemo(() => new Map(courses.map((course) => [course.code, course])), [courses]);
  const saved = schedule.dateSheets[term];

  const changeTerm = (nextTerm) => {
    setTerm(nextTerm);
    setDraft(null);
    setError("");
  };

  const handleFile = async (file) => {
    const validationError = validateSpreadsheet(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setUploading(true);
    try {
      const sheet = await scheduleService.parseDateSheet(file, term);
      const exams = sheet.exams
        .filter((exam) => courseIndex.has(exam.code))
        .map((exam) => ({ ...exam, included: true, reminder: defaultReminder }));
      setDraft({ fileName: sheet.fileName, totalPapers: sheet.totalPapers, exams });
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "The date sheet could not be read."));
    } finally {
      setUploading(false);
    }
  };

  const updateDraftExam = (code, changes) => {
    setDraft((current) => ({
      ...current,
      exams: current.exams.map((exam) => (exam.code === code ? { ...exam, ...changes } : exam)),
    }));
  };

  const applyDefaultReminder = (value) => {
    setDefaultReminder(value);
    setDraft((current) => current && { ...current, exams: current.exams.map((exam) => ({ ...exam, reminder: value })) });
  };

  const handleSave = () => {
    const exams = draft.exams.filter((exam) => exam.included).map(({ included, ...exam }) => exam);
    setDateSheet(term, { fileName: draft.fileName, exams });
    setDraft(null);
    notify(`${exams.length} ${exams.length === 1 ? "exam" : "exams"} added to your calendar.`);
  };

  const includedCount = draft?.exams.filter((exam) => exam.included).length || 0;

  return (
    <>
      <PageHeader title="Date sheets" description="Upload the exam date sheet. Only papers for your registered courses are added.">
        <Tabs label="Exam term" tabs={TERMS} value={term} onChange={changeTerm} />
      </PageHeader>

      {courses.length === 0 ? (
        <Panel>
          <EmptyState
            icon="spreadsheet"
            title="Add your timetable first"
            description="Exams are matched to your registered courses, so select your sections before uploading a date sheet."
            action={
              <Button to="/app/timetable" variant="primary">
                Go to timetable
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          {error && <Notice variant="danger" title={error} />}

          {(!saved || draft) && (
            <FileDropzone
              label={`Drop the ${term} date sheet here`}
              hint="Excel files (.xlsx, .xls) up to 5 MB"
              busy={uploading}
              busyLabel="Reading date sheet…"
              onFile={handleFile}
            />
          )}

          {draft && (
            <Panel
              title={draft.fileName}
              description={`${draft.exams.length} of ${draft.totalPapers} papers match your courses`}
              action={
                <SelectField
                  label="Default reminder"
                  inline
                  options={EXAM_REMINDER_OPTIONS}
                  value={defaultReminder}
                  onChange={(event) => applyDefaultReminder(event.target.value)}
                />
              }
              flush
              footer={
                <>
                  <span className="text-muted">Exams are added as one-time events with the selected reminder.</span>
                  <div className="page-header__actions">
                    <Button onClick={() => setDraft(null)}>Discard</Button>
                    <Button variant="primary" disabled={includedCount === 0} onClick={handleSave}>
                      Add {includedCount} {includedCount === 1 ? "exam" : "exams"} to calendar
                    </Button>
                  </div>
                </>
              }
            >
              {draft.exams.length === 0 ? (
                <EmptyState title="No papers match your courses" description="Check that you uploaded the right date sheet." />
              ) : (
                <ExamTable
                  exams={draft.exams}
                  courseIndex={courseIndex}
                  editable
                  onToggle={(code) => updateDraftExam(code, { included: !draft.exams.find((exam) => exam.code === code).included })}
                  onReminderChange={(code, reminder) => updateDraftExam(code, { reminder })}
                />
              )}
            </Panel>
          )}

          {saved && !draft && (
            <Panel
              title={saved.fileName}
              description={`${saved.exams.length} exams on your calendar`}
              action={
                <Button size="sm" onClick={() => setDraft({ fileName: saved.fileName, totalPapers: saved.exams.length, exams: saved.exams.map((exam) => ({ ...exam, included: true })) })}>
                  Edit
                </Button>
              }
              flush
            >
              <ExamTable exams={saved.exams.filter((exam) => courseIndex.has(exam.code))} courseIndex={courseIndex} />
            </Panel>
          )}
        </>
      )}
    </>
  );
}
