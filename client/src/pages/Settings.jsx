import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordModal from "../components/settings/ChangePasswordModal.jsx";
import ProfileForm from "../components/settings/ProfileForm.jsx";
import SettingRow from "../components/settings/SettingRow.jsx";
import Button from "../components/ui/Button.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import Switch from "../components/ui/Switch.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { authService } from "../services/authService.js";
import { getErrorMessage } from "../utils/errors.js";
import { CLASS_REMINDER_OPTIONS, EXAM_REMINDER_OPTIONS } from "../utils/reminders.js";
import "../styles/pages/settings.css";

const SUMMARY_TIME_OPTIONS = [
  { value: "06:30", label: "6:30 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "07:30", label: "7:30 AM" },
  { value: "08:00", label: "8:00 AM" },
];

const VIEW_OPTIONS = [
  { value: "timeGridWeek", label: "Week" },
  { value: "timeGridDay", label: "Day" },
  { value: "dayGridMonth", label: "Month" },
];

function SettingSelect({ id, options, value, onChange }) {
  return (
    <select id={id} className="select" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function NotificationSettings({ settings, onChange }) {
  return (
    <Panel title="Notifications" flush>
      <SettingRow
        label="Morning summary email"
        description="Today's classes plus upcoming exams and deadlines, sent every morning."
      >
        <Switch
          label="Morning summary email"
          checked={settings.morningSummary}
          onChange={(value) => onChange({ morningSummary: value })}
        />
      </SettingRow>
      {settings.morningSummary && (
        <SettingRow label="Send at" htmlFor="summary-time">
          <SettingSelect
            id="summary-time"
            options={SUMMARY_TIME_OPTIONS}
            value={settings.summaryTime}
            onChange={(value) => onChange({ summaryTime: value })}
          />
        </SettingRow>
      )}
      <SettingRow label="Class reminder" htmlFor="class-reminder">
        <SettingSelect
          id="class-reminder"
          options={CLASS_REMINDER_OPTIONS}
          value={settings.classReminder}
          onChange={(value) => onChange({ classReminder: value })}
        />
      </SettingRow>
      <SettingRow
        label="Exam reminder"
        description="Used as the default when you upload a date sheet."
        htmlFor="exam-reminder"
      >
        <SettingSelect
          id="exam-reminder"
          options={EXAM_REMINDER_OPTIONS}
          value={settings.examReminder}
          onChange={(value) => onChange({ examReminder: value })}
        />
      </SettingRow>
    </Panel>
  );
}

function CalendarSettings({ settings, onChange }) {
  return (
    <Panel title="Calendar" flush>
      <SettingRow label="Default view" htmlFor="default-view">
        <SettingSelect
          id="default-view"
          options={VIEW_OPTIONS}
          value={settings.defaultView}
          onChange={(value) => onChange({ defaultView: value })}
        />
      </SettingRow>
      <SettingRow label="Show Saturday" description="Turn on if you have weekend classes.">
        <Checkbox
          label="Show Saturday"
          hideLabel
          checked={settings.showSaturday}
          onChange={() => onChange({ showSaturday: !settings.showSaturday })}
        />
      </SettingRow>
    </Panel>
  );
}

function AccountSettings() {
  const { logout } = useAuth();
  const { resetSchedule } = useSchedule();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePasswordChanged = () => {
    setPasswordOpen(false);
    notify("Password updated.");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authService.deleteAccount();
      resetSchedule();
      logout();
      navigate("/", { replace: true });
    } catch (error) {
      notify(getErrorMessage(error), "danger");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Panel title="Account" flush>
      <SettingRow label="Password" description="Change the password you use to log in.">
        <Button onClick={() => setPasswordOpen(true)}>Change password</Button>
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
      <PageHeader title="Settings" description="Manage your profile, notifications and calendar preferences." />
      <ProfileForm />
      <NotificationSettings settings={schedule.settings} onChange={updateSettings} />
      <CalendarSettings settings={schedule.settings} onChange={updateSettings} />
      <AccountSettings />
    </div>
  );
}
