import { useMemo, useState } from "react";
import FileDropzone from "../components/app/FileDropzone.jsx";
import FileSummary from "../components/app/FileSummary.jsx";
import SectionTable from "../components/app/SectionTable.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { scheduleService } from "../services/scheduleService.js";
import { describeClash, findClashes, getClashingSlotKeys } from "../utils/clashes.js";
import { getErrorMessage } from "../utils/errors.js";
import { formatFileSize, validateSpreadsheet } from "../utils/files.js";
import { toSelectedCourse } from "../utils/schedule.js";
import "../styles/pages/timetable.css";

function createDraft(catalog, selections) {
  const selected = new Map(selections.map((selection) => [selection.code, selection.section]));
  return Object.fromEntries(
    catalog.courses.map((course) => [
      course.code,
      {
        included: selected.has(course.code),
        section: selected.get(course.code) || Object.keys(course.sections)[0],
      },
    ])
  );
}

function SectionPicker({ catalog, selections }) {
  const [draft, setDraft] = useState(() => createDraft(catalog, selections));
  const [query, setQuery] = useState("");

  const draftCourses = useMemo(
    () =>
      catalog.courses
        .filter((course) => draft[course.code].included)
        .map((course) => toSelectedCourse(course, draft[course.code].section)),
    [catalog, draft]
  );

  const clashes = useMemo(() => findClashes(draftCourses), [draftCourses]);
  const clashingSlots = useMemo(() => getClashingSlotKeys(clashes), [clashes]);
  const classesPerWeek = draftCourses.reduce((total, course) => total + course.slots.length, 0);

  const visibleCourses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return catalog.courses;
    return catalog.courses.filter(
      (course) => course.name.toLowerCase().includes(term) || course.code.toLowerCase().includes(term)
    );
  }, [catalog, query]);

  const updateEntry = (code, changes) => {
    setDraft((current) => ({ ...current, [code]: { ...current[code], ...changes } }));
  };

  return (
    <>
      {clashes.length > 0 ? (
        <Notice
          variant="warning"
          title={clashes.length === 1 ? "1 clash between selected sections" : `${clashes.length} clashes between selected sections`}
        >
          <ul className="clash-list">
            {clashes.map((clash) => (
              <li key={clash.id}>{describeClash(clash)}</li>
            ))}
          </ul>
        </Notice>
      ) : (
        draftCourses.length > 0 && <Notice variant="success" title="No clashes between the selected sections." />
      )}

      <Panel flush>
        <div className="toolbar">
          <div className="toolbar__search">
            <Icon name="search" size={14} className="toolbar__search-icon" />
            <input
              type="search"
              className="input"
              placeholder="Search courses"
              aria-label="Search courses"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <span className="toolbar__meta">
            {draftCourses.length} selected · {classesPerWeek} classes per week
          </span>
        </div>
        <SectionTable
          courses={visibleCourses}
          draft={draft}
          clashingSlots={clashingSlots}
          onToggle={(code) => updateEntry(code, { included: !draft[code].included })}
          onSectionChange={(code, section) => updateEntry(code, { section })}
        />
      </Panel>
    </>
  );
}

export default function Timetable() {
  const { schedule, setCatalog } = useSchedule();
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState("");
  const catalog = schedule.catalog;

  const handleFile = async (file) => {
    const validationError = validateSpreadsheet(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setUploading(true);
    try {
      setCatalog(await scheduleService.parseTimetable(file));
      setReplacing(false);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "The timetable could not be read."));
    } finally {
      setUploading(false);
    }
  };

  const showUpload = !catalog || replacing;

  return (
    <>
      <PageHeader title="Timetable" description="Upload the university timetable, then select your courses and sections." />
      {error && <Notice variant="danger" title={error} />}
      {showUpload ? (
        <FileDropzone
          label="Drop the timetable Excel file here"
          hint="Excel files (.xlsx, .xls) up to 5 MB"
          busy={uploading}
          busyLabel="Reading timetable…"
          onFile={handleFile}
        />
      ) : (
        <>
          <FileSummary
            name={catalog.fileName}
            meta={`${formatFileSize(catalog.fileSize)} · ${catalog.courses.length} courses, ${catalog.totalSections} sections found`}
            action={
              <Button size="sm" onClick={() => setReplacing(true)}>
                Replace file
              </Button>
            }
          />
          <SectionPicker key={catalog.uploadedAt} catalog={catalog} selections={schedule.selections} />
        </>
      )}
    </>
  );
}
