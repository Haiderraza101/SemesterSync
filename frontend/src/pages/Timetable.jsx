import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileDropzone from "../components/app/FileDropzone.jsx";
import FileSummary from "../components/app/FileSummary.jsx";
import SectionFilters from "../components/app/SectionFilters.jsx";
import SectionTable from "../components/app/SectionTable.jsx";
import Stepper from "../components/app/Stepper.jsx";
import Button from "../components/ui/Button.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { scheduleService } from "../services/scheduleService.js";
import { describeClash, findClashes, getClashingSlotKeys } from "../utils/clashes.js";
import { getErrorMessage } from "../utils/errors.js";
import { formatFileSize, validateSpreadsheet } from "../utils/files.js";
import { toSelectedCourse } from "../utils/schedule.js";
import {
  SCOPES,
  defaultSection,
  findUserSection,
  getBatchOptions,
  getVisibleSections,
  isOutdatedCatalog,
  matchesSearch,
  parseUserSection,
} from "../utils/sectionFilters.js";
import "../styles/pages/timetable.css";

const STEPS = ["Upload file", "Select sections", "Add to calendar"];

function createDraft(catalog, selections, user) {
  const selected = new Map(selections.map((selection) => [selection.code, selection.section]));
  return Object.fromEntries(
    catalog.courses.map((course) => [
      course.code,
      { included: selected.has(course.code), section: selected.get(course.code) || defaultSection(course, user) },
    ])
  );
}

function initialFilters(catalog, user) {
  const base = { type: "all", batch: "all" };
  const semesterFilters = { ...base, scope: SCOPES.semester };
  const offersSemester = catalog.courses.some((course) => getVisibleSections(course, semesterFilters, user).length > 0);
  return offersSemester ? semesterFilters : { ...base, scope: SCOPES.all };
}

function SectionPicker({ catalog, selections, userSection, onSave }) {
  const user = useMemo(() => parseUserSection(userSection), [userSection]);
  const [draft, setDraft] = useState(() => createDraft(catalog, selections, user));
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(() => initialFilters(catalog, user));
  const batches = useMemo(() => getBatchOptions(catalog), [catalog]);

  const myCoreCourses = useMemo(
    () =>
      catalog.courses.filter((course) => {
        const section = findUserSection(course, user);
        return section && (course.sections[section].type || "core") === "core";
      }),
    [catalog, user]
  );

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

  const sectionOptions = useMemo(
    () =>
      new Map(
        catalog.courses.map((course) => {
          const visible = getVisibleSections(course, filters, user);
          const selected = draft[course.code].section;
          const options = draft[course.code].included && !visible.includes(selected) ? [selected, ...visible] : visible;
          return [course.code, options];
        })
      ),
    [catalog, filters, user, draft]
  );

  const visibleCourses = useMemo(() => {
    const term = query.trim().toLowerCase();
    return catalog.courses.filter((course) => {
      const options = sectionOptions.get(course.code);
      return options.length > 0 && matchesSearch(course, options, term);
    });
  }, [catalog, query, sectionOptions]);

  const updateEntry = (code, changes) => {
    setDraft((current) => ({ ...current, [code]: { ...current[code], ...changes } }));
  };

  const toggleCourse = (code) => {
    const options = sectionOptions.get(code);
    const entry = draft[code];
    const section = !entry.included && !options.includes(entry.section) ? options[0] : entry.section;
    updateEntry(code, { included: !entry.included, section });
  };

  const selectMyCoreCourses = () => {
    setDraft((current) => {
      const next = { ...current };
      myCoreCourses.forEach((course) => {
        next[course.code] = { included: true, section: findUserSection(course, user) };
      });
      return next;
    });
  };

  const handleSave = () => {
    onSave(draftCourses.map((course) => ({ code: course.code, section: course.section })));
  };

  return (
    <>
      {clashes.length > 0 ? (
        <Notice
          variant="warning"
          title={
            clashes.length === 1
              ? "1 clash between selected sections"
              : `${clashes.length} clashes between selected sections`
          }
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

      <Panel
        flush
        footer={
          <>
            <span className="toolbar__meta">Classes repeat weekly until the last teaching day of the semester.</span>
            <div className="page-header__actions">
              <Button onClick={() => setDraft(createDraft(catalog, selections, user))}>Reset</Button>
              <Button variant="primary" disabled={draftCourses.length === 0} onClick={handleSave}>
                Add {draftCourses.length} {draftCourses.length === 1 ? "course" : "courses"} to calendar
              </Button>
            </div>
          </>
        }
      >
        <div className="toolbar">
          <SectionFilters
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFiltersChange={setFilters}
            user={user}
            batches={batches}
          />
          <div className="toolbar__actions">
            {myCoreCourses.length > 0 && (
              <Button size="sm" onClick={selectMyCoreCourses}>
                Select my {myCoreCourses.length} core courses
              </Button>
            )}
            <span className="toolbar__meta">
              {draftCourses.length} selected · {classesPerWeek} classes per week
            </span>
          </div>
        </div>
        <SectionTable
          courses={visibleCourses}
          draft={draft}
          sectionOptions={sectionOptions}
          clashingSlots={clashingSlots}
          onToggle={toggleCourse}
          onSectionChange={(code, section) => updateEntry(code, { section })}
        />
      </Panel>
    </>
  );
}

export default function Timetable() {
  const { schedule, setCatalog, setSelections } = useSchedule();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
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

  const handleSave = (selections) => {
    setSelections(selections);
    notify(`${selections.length} ${selections.length === 1 ? "course" : "courses"} added to your calendar.`);
    navigate("/app/calendar");
  };

  return (
    <>
      <PageHeader
        title="Timetable"
        description="Upload the university timetable, then select your courses and sections."
      >
        <Stepper steps={STEPS} current={showUpload ? 0 : 1} />
      </PageHeader>
      {error && <Notice variant="danger" title={error} />}
      {showUpload ? (
        <FileDropzone
          label="Drop the timetable Excel file here"
          hint="Excel files (.xlsx, .xls) up to 10 MB"
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
          {isOutdatedCatalog(catalog) && (
            <Notice
              variant="warning"
              title="Upload this timetable again to filter by course type and batch."
              action={
                <Button size="sm" onClick={() => setReplacing(true)}>
                  Upload again
                </Button>
              }
            >
              It was read by an earlier version of the parser that did not record electives, repeat courses or batches.
            </Notice>
          )}
          <SectionPicker
            key={catalog.uploadedAt}
            catalog={catalog}
            selections={schedule.selections}
            userSection={user?.section}
            onSave={handleSave}
          />
        </>
      )}
    </>
  );
}
