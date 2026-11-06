import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { scheduleService } from "../services/scheduleService.js";
import { copyText } from "../utils/clipboard.js";
import { getErrorMessage } from "../utils/errors.js";
import { getCourseIndex } from "../utils/schedule.js";
import "../styles/pages/share.css";

const IMPORT_MODES = [
  { value: "replace", label: "Replace my current schedule" },
  { value: "merge", label: "Add to my current schedule" },
];

function ShareCodePanel() {
  const { schedule, setShareCode } = useSchedule();
  const { notify } = useToast();
  const [generating, setGenerating] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [include, setInclude] = useState({ exams: true, tasks: false });
  const code = schedule.shareCode;
  const shareLink = code ? `${window.location.origin}/join/${code}` : "";
  const examCount = (schedule.dateSheets.midterm?.exams.length || 0) + (schedule.dateSheets.final?.exams.length || 0);

  const generate = async () => {
    setGenerating(true);
    try {
      const { code: nextCode } = await scheduleService.createShareCode(schedule.selections);
      setShareCode(nextCode);
      notify("New share code created.");
    } catch (error) {
      notify(getErrorMessage(error), "danger");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async (value, message) => {
    try {
      await copyText(value);
      notify(message);
    } catch {
      notify("Copy failed. Select the text and copy it manually.", "danger");
    }
  };

  const disableSharing = () => {
    setShareCode(null);
    setConfirmDisable(false);
    notify("Sharing disabled.");
  };

  return (
    <Panel title="Your schedule code" className="share-layout__panel">
      <div className="share-panel__body">
        {code ? (
          <>
            <div className="share-code">
              <output className="share-code__value" aria-label="Share code">
                {code}
              </output>
              <Button variant="primary" size="lg" onClick={() => copy(code, "Code copied.")}>
                Copy code
              </Button>
            </div>
            <p className="text-muted share-panel__link">
              Link:{" "}
              <button type="button" className="link-button" onClick={() => copy(shareLink, "Link copied.")}>
                {shareLink}
              </button>
            </p>
          </>
        ) : (
          <p className="text-secondary">Create a code that classmates can enter to copy your courses and sections.</p>
        )}

        <fieldset className="share-panel__options">
          <legend className="field__label">Included in the code</legend>
          <Checkbox label={`Courses and sections (${schedule.selections.length})`} checked readOnly disabled />
          <Checkbox
            label={`Exams (${examCount})`}
            checked={include.exams}
            onChange={() => setInclude((current) => ({ ...current, exams: !current.exams }))}
          />
          <Checkbox
            label="Assignments and quizzes"
            checked={include.tasks}
            onChange={() => setInclude((current) => ({ ...current, tasks: !current.tasks }))}
          />
        </fieldset>
        <p className="text-muted share-panel__note">Attendance and personal notes are never shared.</p>

        <div className="share-panel__actions">
          <Button
            variant={code ? "secondary" : "primary"}
            disabled={generating || schedule.selections.length === 0}
            onClick={generate}
          >
            {generating ? "Generating…" : code ? "Generate new code" : "Generate code"}
          </Button>
          {code && (
            <Button variant="danger" onClick={() => setConfirmDisable(true)}>
              Disable sharing
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDisable}
        title="Disable sharing?"
        description="The current code will stop working for anyone who has it."
        confirmLabel="Disable"
        destructive
        onConfirm={disableSharing}
        onCancel={() => setConfirmDisable(false)}
      />
    </Panel>
  );
}

function ImportPanel() {
  const { schedule, importSchedule } = useSchedule();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get("code") || "");
  const [lookup, setLookup] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("replace");
  const [imported, setImported] = useState(false);

  const courseIndex = useMemo(() => getCourseIndex(schedule.catalog), [schedule.catalog]);

  const handleLookup = async (event) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Enter a share code.");
      return;
    }
    setError("");
    setImported(false);
    setLoading(true);
    try {
      setLookup(await scheduleService.lookupShareCode(code));
    } catch (lookupError) {
      setLookup(null);
      setError(getErrorMessage(lookupError));
    } finally {
      setLoading(false);
    }
  };

  const available = lookup ? lookup.selections.filter((selection) => courseIndex.has(selection.code)) : [];
  const missing = lookup ? lookup.selections.length - available.length : 0;

  const handleImport = () => {
    importSchedule(available, mode);
    setImported(true);
    notify(`${available.length} ${available.length === 1 ? "course" : "courses"} imported.`);
  };

  return (
    <Panel title="Import a schedule" className="share-layout__panel">
      <div className="share-panel__body">
        <form className="share-lookup" onSubmit={handleLookup} noValidate>
          <label htmlFor="import-code" className="field__label">
            Enter a code
          </label>
          <div className="share-lookup__row">
            <input
              id="import-code"
              className="input share-lookup__input"
              placeholder="XXXX-XXXX"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              aria-invalid={error ? true : undefined}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Looking up…" : "Look up"}
            </Button>
          </div>
          {error && <p className="field__error">{error}</p>}
        </form>

        {lookup && (
          <>
            <div className="share-preview">
              <div className="share-preview__header">
                <span className="cell-primary">
                  {lookup.owner} · {lookup.section}
                </span>
                <span className="text-muted">{lookup.selections.length} courses</span>
              </div>
              <table className="data-table">
                <tbody>
                  {lookup.selections.map((selection) => (
                    <tr key={selection.code}>
                      <td className="cell-primary">{courseIndex.get(selection.code)?.name || selection.code}</td>
                      <td className="cell-action">Section {selection.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {missing > 0 && (
              <Notice
                variant="warning"
                title={`${missing} ${missing === 1 ? "course is" : "courses are"} not in your uploaded timetable and will be skipped.`}
              />
            )}

            <fieldset className="share-panel__options">
              <legend className="field__label">When importing</legend>
              {IMPORT_MODES.map((option) => (
                <label key={option.value} className="checkbox">
                  <input
                    type="radio"
                    className="radio__input"
                    name="import-mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>

            {imported && <Notice variant="success" title="Schedule imported. Your calendar has been updated." />}

            <Button variant="primary" block disabled={available.length === 0 || imported} onClick={handleImport}>
              Import schedule
            </Button>
          </>
        )}
      </div>
    </Panel>
  );
}

export default function Share() {
  return (
    <>
      <PageHeader
        title="Share code"
        description="Share your schedule with classmates, or copy someone else's into your calendar."
      />
      <div className="share-layout">
        <ShareCodePanel />
        <ImportPanel />
      </div>
    </>
  );
}
