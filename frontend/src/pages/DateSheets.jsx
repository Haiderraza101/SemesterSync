import { useMemo, useState } from "react";
import CourseCell from "../components/app/CourseCell.jsx";
import FileDropzone from "../components/app/FileDropzone.jsx";
import Button from "../components/ui/Button.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { scheduleService } from "../services/scheduleService.js";
import { formatShortDate, formatTimeRange, parseDateKey } from "../utils/date.js";
import { getErrorMessage } from "../utils/errors.js";
import { validateSpreadsheet } from "../utils/files.js";
import { EXAM_TERMS, examTermLabel } from "../utils/examTerms.js";
import { getSelectedCourses } from "../utils/schedule.js";



function ExamTable({ exams, courseIndex, editable, onToggle }) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table" style={{ minWidth: 560 }}>
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
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => {
            const course = courseIndex.get(exam.code);
            return (
              <tr key={exam.code}>
                {editable && (
                  <td>
                    <Checkbox
                      label={`Include ${course.name}`}
                      hideLabel
                      checked={exam.included}
                      onChange={() => onToggle(exam.code)}
                    />
                  </td>
                )}
                <td>
                  <CourseCell color={course.color} name={course.name} meta={exam.code} />
                </td>
                <td className="cell-nowrap cell-primary">{formatShortDate(parseDateKey(exam.date))}</td>
                <td className="cell-nowrap">{formatTimeRange(exam.start, exam.end)}</td>
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
      if (sheet.detectedTerm && sheet.detectedTerm !== term) {
        setTerm(sheet.detectedTerm);
        notify(`This file is the ${examTermLabel(sheet.detectedTerm)} date sheet, so it was opened under that tab.`);
      }
      const exams = sheet.exams
        .filter((exam) => courseIndex.has(exam.code))
        .map((exam) => ({ ...exam, included: true, reminder: exam.reminder || schedule.settings.examReminder }));
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

  const handleSave = () => {
    const exams = draft.exams.filter((exam) => exam.included).map(({ included, ...exam }) => exam);
    setDateSheet(term, { fileName: draft.fileName, exams });
    setDraft(null);
    notify(`${exams.length} ${exams.length === 1 ? "exam" : "exams"} added to your calendar.`);
  };

  const includedCount = draft?.exams.filter((exam) => exam.included).length || 0;

  return (
    <>
      <PageHeader
        title="Date sheets"
        description="Upload the exam date sheet. Only papers for your registered courses are added."
      >
        <Tabs label="Exam term" tabs={EXAM_TERMS} value={term} onChange={changeTerm} />
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
              label={`Drop the ${examTermLabel(term)} date sheet here`}
              hint="Excel files (.xlsx, .xls) up to 10 MB"
              busy={uploading}
              busyLabel="Reading date sheet…"
              onFile={handleFile}
            />
          )}

          {draft && (
            <Panel
              title={draft.fileName}
              description={`${draft.exams.length} of ${draft.totalPapers} papers match your courses`}
              flush
              footer={
                <>
                  <span className="text-muted">Reminders follow your exam reminder setting in Settings.</span>
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
                <EmptyState variant="compact"
                  title="No papers match your courses"
                  description="Check that you uploaded the right date sheet."
                />
              ) : (
                <ExamTable
                  exams={draft.exams}
                  courseIndex={courseIndex}
                  editable
                  onToggle={(code) =>
                    updateDraftExam(code, { included: !draft.exams.find((exam) => exam.code === code).included })
                  }
                />
              )}
            </Panel>
          )}

          {saved && !draft && (
            <Panel
              title={saved.fileName}
              description={`${saved.exams.length} exams on your calendar`}
              action={
                <Button
                  size="sm"
                  onClick={() =>
                    setDraft({
                      fileName: saved.fileName,
                      totalPapers: saved.exams.length,
                      exams: saved.exams.map((exam) => ({ ...exam, included: true })),
                    })
                  }
                >
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
