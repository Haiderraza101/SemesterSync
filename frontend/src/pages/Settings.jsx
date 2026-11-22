import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordModal from "../components/settings/ChangePasswordModal.jsx";
import ProfileForm from "../components/settings/ProfileForm.jsx";
import SettingRow from "../components/settings/SettingRow.jsx";
import Button from "../components/ui/Button.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import DatePicker from "../components/ui/DatePicker.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import Select from "../components/ui/Select.jsx";
import Switch from "../components/ui/Switch.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { authService } from "../services/authService.js";
import { getErrorMessage } from "../utils/errors.js";
import "../styles/pages/settings.css";

const VIEW_OPTIONS = [
  { value: "timeGridWeek", label: "Week" },
  { value: "timeGridDay", label: "Day" },
  { value: "dayGridMonth", label: "Month" },
];

function SettingsSection({ title, description, children }) {
  return (
    <section className="settings-section">
      <div className="settings-section__intro">
        <h2 className="settings-section__title">{title}</h2>
        <p className="settings-section__description">{description}</p>
      </div>
      <div className="settings-section__content">{children}</div>
    </section>
  );
}

function SettingSelect({ id, options, value, onChange }) {
  return <Select id={id} options={options} value={value} onChange={onChange} />;
}

function SemesterSettings({ settings, onChange }) {
  const { notify } = useToast();
  const [values, setValues] = useState({
    semesterName: settings.semesterName || "",
    semesterStart: settings.semesterStart || "",
    semesterEnd: settings.semesterEnd || "",
  });
  const [error, setError] = useState("");
  const changed =
    values.semesterName !== (settings.semesterName || "") ||
    values.semesterStart !== (settings.semesterStart || "") ||
    values.semesterEnd !== (settings.semesterEnd || "");

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  const save = (event) => {
    event.preventDefault();
    if (!values.semesterStart || !values.semesterEnd) {
      setError("Enter both the first and the last teaching day.");
      return;
    }
    if (values.semesterEnd < values.semesterStart) {
      setError("The last teaching day must be after the first one.");
      return;
    }
    onChange({ ...values, semesterName: values.semesterName.trim() });
    notify("Semester dates saved.");
  };

  return (
    <form onSubmit={save} noValidate>
      <Panel
        flush
        footer={
          <>
            <span className="toolbar__meta">Classes and attendance only count between these dates.</span>
            <Button type="submit" variant="primary" disabled={!changed}>
              Save semester
            </Button>
          </>
        }
      >
        {error && <Notice variant="danger" title={error} />}
        <SettingRow label="Semester name" htmlFor="semester-name" description="Detected from the timetable when possible.">
          <input
            id="semester-name"
            className="input"
            maxLength={40}
            placeholder="Fall 2026"
            value={values.semesterName}
            onChange={update("semesterName")}
          />
        </SettingRow>
        <SettingRow label="First teaching day" htmlFor="semester-start">
          <DatePicker
            id="semester-start"
            value={values.semesterStart}
            max={values.semesterEnd || undefined}
            onChange={(value) => update("semesterStart")({ target: { value } })}
          />
        </SettingRow>
        <SettingRow label="Last teaching day" htmlFor="semester-end">
          <DatePicker
            id="semester-end"
            value={values.semesterEnd}
            min={values.semesterStart || undefined}
            onChange={(value) => update("semesterEnd")({ target: { value } })}
          />
        </SettingRow>
      </Panel>
    </form>
  );
}

function CalendarSettings({ settings, onChange }) {
  return (
    <Panel flush>
      <SettingRow label="Default view" htmlFor="default-view">
        <SettingSelect
          id="default-view"
          options={VIEW_OPTIONS}
          value={settings.defaultView}
          onChange={(value) => onChange({ defaultView: value })}
        />
      </SettingRow>
      <SettingRow label="Show Saturday" description="Turn on if you have weekend classes.">
        <Switch
          label="Show Saturday"
          checked={settings.showSaturday}
          onChange={(value) => onChange({ showSaturday: value })}
        />
      </SettingRow>
    </Panel>
  );
}

function AccountSettings() {
  const { clearSession, logoutEverywhere } = useAuth();
  const { resetSchedule } = useSchedule();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handlePasswordChanged = (message) => {
    setPasswordOpen(false);
    notify(message || "Password updated.");
  };

  const handleLogoutEverywhere = async () => {
    setSigningOut(true);
    try {
      await logoutEverywhere();
      navigate("/login", { replace: true, state: { notice: "You have been logged out of all devices." } });
    } catch (error) {
      notify(getErrorMessage(error), "danger");
      setSigningOut(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authService.deleteAccount();
      resetSchedule();
      clearSession();
      navigate("/", { replace: true });
    } catch (error) {
      notify(getErrorMessage(error), "danger");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Panel flush>
      <SettingRow label="Password" description="Change the password you use to log in.">
        <Button onClick={() => setPasswordOpen(true)}>Change password</Button>
      </SettingRow>
      <SettingRow label="Devices" description="Log out everywhere you are signed in, including this browser.">
        <Button disabled={signingOut} onClick={handleLogoutEverywhere}>
          {signingOut ? "Logging out…" : "Log out of all devices"}
        </Button>
      </SettingRow>
      <SettingRow label="Delete account" description="Permanently removes your schedule, attendance and settings.">
        <Button variant="danger" disabled={deleting} onClick={() => setConfirmDelete(true)}>
          Delete account
        </Button>
      </SettingRow>
      <ChangePasswordModal open={passwordOpen} onDone={handlePasswordChanged} onClose={() => setPasswordOpen(false)} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        description="This cannot be undone. Your schedule, attendance records and settings will be removed."
        confirmLabel="Delete account"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Panel>
  );
}

export default function Settings() {
  const { schedule, updateSettings } = useSchedule();

  return (
    <div className="settings-page">
      <PageHeader title="Settings" description="Manage your profile, semester and calendar preferences." />
      <SettingsSection title="Profile" description="Your name, email, roll number and section. The section is used to suggest your courses.">
        <ProfileForm />
      </SettingsSection>
      <SettingsSection
        title="Semester"
        description="Classes repeat every week between the first and last teaching day. Attendance limits use these dates."
      >
        <SemesterSettings settings={schedule.settings} onChange={updateSettings} />
      </SettingsSection>
      <SettingsSection title="Calendar" description="How the calendar opens and which days it shows.">
        <CalendarSettings settings={schedule.settings} onChange={updateSettings} />
      </SettingsSection>
      <SettingsSection title="Account" description="Password, signed-in devices and deleting your account.">
        <AccountSettings />
      </SettingsSection>
    </div>
  );
}
