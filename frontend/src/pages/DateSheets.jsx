import { useMemo, useState } from "react";
import CourseCell from "../components/app/CourseCell.jsx";
import FileDropzone from "../components/app/FileDropzone.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import KpiCard, { KpiGrid } from "../components/ui/KpiCard.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { scheduleService } from "../services/scheduleService.js";
import { cx } from "../utils/cx.js";
import {
  DAY_NAMES,
  combineDateTime,
  formatDayMonth,
  formatShortDate,
  formatTimeRange,
  parseDateKey,
  timeToMinutes,
} from "../utils/date.js";
import { getErrorMessage } from "../utils/errors.js";
import { validateSpreadsheet } from "../utils/files.js";
import { EXAM_TERMS, examTermLabel } from "../utils/examTerms.js";
import { daysAway } from "../utils/relative.js";
import { getExams, getSelectedCourses } from "../utils/schedule.js";
import "../styles/pages/datesheets.css";



function ExamTable({ exams, courseIndex, editable, onToggle, now }) {
  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  const perDay = sorted.reduce((counts, exam) => counts.set(exam.date, (counts.get(exam.date) || 0) + 1), new Map());

  return (
    <div className="data-table-wrapper">
      <table className="data-table data-table--zebra exam-table">
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
            <th scope="col">Duration</th>
            <th scope="col" className="cell-action">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((exam) => {
            const course = courseIndex.get(exam.code);
            const date = parseDateKey(exam.date);
            const finished = combineDateTime(exam.date, exam.end) < now;
            const when = daysAway(date, now);
            const minutes = timeToMinutes(exam.end) - timeToMinutes(exam.start);
            return (
              <tr key={exam.code} className={cx(editable && !exam.included && "exam-table__row--off")}>
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
                <td>
                  <div className="cell-stack">
                    <span className="cell-strong">{formatShortDate(date)}</span>
                    {perDay.get(exam.date) > 1 ? (
                      <span className="exam-table__same-day">{perDay.get(exam.date)} papers this day</span>
                    ) : (
                      <span className="cell-stack__sub">{DAY_NAMES[date.getDay()]}</span>
                    )}
                  </div>
                </td>
                <td className="cell-nowrap">{formatTimeRange(exam.start, exam.end)}</td>
                <td className="cell-muted">{minutes >= 60 ? `${Math.round((minutes / 60) * 10) / 10} h` : `${minutes} min`}</td>
                <td className="cell-action">
                  {finished ? (
                    <StatusBadge status="done" />
                  ) : (
                    <Badge variant={when.variant} compact>
                      {when.label}
                    </Badge>
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

function ExamSummary({ exams, termExams, now }) {
  const upcoming = exams.filter((exam) => combineDateTime(exam.date, exam.end) >= now).sort((a, b) => a.startsAt - b.startsAt);
  const next = upcoming[0];
  const done = exams.length - upcoming.length;
  const termDates = termExams.map((exam) => exam.date).sort();
  const nextWhen = next ? daysAway(next.startsAt, now) : null;

  return (
    <KpiGrid>
      <KpiCard
        label="Papers on your calendar"
        value={exams.length}
        detail={`${EXAM_TERMS.filter((term) => exams.some((exam) => exam.term === term.value)).length} of 3 date sheets added`}
      />
      <KpiCard
        label="Next paper"
        value={next ? (nextWhen.days <= 1 ? nextWhen.label : nextWhen.days) : "None"}
        unit={next && nextWhen.days > 1 ? "days" : undefined}
        detail={next ? `${next.course.name}, ${formatDayMonth(next.startsAt)}` : "No upcoming papers"}
        tone={next && nextWhen.days <= 2 ? "warning" : undefined}
      />
      <KpiCard
        label="This date sheet"
        value={termExams.length}
        unit={termExams.length === 1 ? "paper" : "papers"}
        detail={
          termDates.length
            ? `${formatDayMonth(parseDateKey(termDates[0]))} to ${formatDayMonth(parseDateKey(termDates[termDates.length - 1]))}`
            : "Not uploaded yet"
        }
      />
      <KpiCard
        label="Papers done"
        value={done}
        unit={`of ${exams.length}`}
        progress={exams.length ? (done / exams.length) * 100 : 0}
        tone={exams.length && done === exams.length ? "success" : undefined}
        detail={exams.length ? `${upcoming.length} still to go` : "Upload a date sheet"}
      />
    </KpiGrid>
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
  const now = useMemo(() => new Date(), []);
  const allExams = useMemo(() => getExams(schedule, courses), [schedule, courses]);
  const termTabs = EXAM_TERMS.map((item) => ({
    ...item,
    count: (schedule.dateSheets[item.value]?.exams || []).filter((exam) => courseIndex.has(exam.code)).length,
  }));

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
        .map((exam) => ({ ...exam, included: true }));
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
        description="Upload each exam date sheet. Only papers for your registered courses are added to your calendar."
      >
        <Tabs label="Exam term" tabs={termTabs} value={term} onChange={changeTerm} />
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
          <ExamSummary exams={allExams} termExams={allExams.filter((exam) => exam.term === term)} now={now} />
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
                  <span className="text-muted">Only papers for your selected courses are listed.</span>
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
                  now={now}
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
              title={`${examTermLabel(term)} papers`}
              description={`${saved.exams.length} ${saved.exams.length === 1 ? "paper" : "papers"} on your calendar, from ${saved.fileName}`}
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
              <ExamTable
                exams={saved.exams.filter((exam) => courseIndex.has(exam.code))}
                courseIndex={courseIndex}
                now={now}
              />
            </Panel>
          )}
        </>
      )}
    </>
  );
}
