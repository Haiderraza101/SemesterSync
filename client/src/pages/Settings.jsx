import SettingRow from "../components/settings/SettingRow.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import Switch from "../components/ui/Switch.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
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
      <SettingRow label="Morning summary email" description="Today's classes plus upcoming exams and deadlines, sent every morning.">
        <Switch label="Morning summary email" checked={settings.morningSummary} onChange={(value) => onChange({ morningSummary: value })} />
      </SettingRow>
      {settings.morningSummary && (
        <SettingRow label="Send at" htmlFor="summary-time">
          <SettingSelect id="summary-time" options={SUMMARY_TIME_OPTIONS} value={settings.summaryTime} onChange={(value) => onChange({ summaryTime: value })} />
        </SettingRow>
      )}
      <SettingRow label="Class reminder" htmlFor="class-reminder">
        <SettingSelect id="class-reminder" options={CLASS_REMINDER_OPTIONS} value={settings.classReminder} onChange={(value) => onChange({ classReminder: value })} />
      </SettingRow>
      <SettingRow label="Exam reminder" description="Used as the default when you upload a date sheet." htmlFor="exam-reminder">
        <SettingSelect id="exam-reminder" options={EXAM_REMINDER_OPTIONS} value={settings.examReminder} onChange={(value) => onChange({ examReminder: value })} />
      </SettingRow>
    </Panel>
  );
}

function CalendarSettings({ settings, onChange }) {
  return (
    <Panel title="Calendar" flush>
      <SettingRow label="Default view" htmlFor="default-view">
        <SettingSelect id="default-view" options={VIEW_OPTIONS} value={settings.defaultView} onChange={(value) => onChange({ defaultView: value })} />
      </SettingRow>
      <SettingRow label="Show Saturday" description="Turn on if you have weekend classes.">
        <Checkbox label="Show Saturday" hideLabel checked={settings.showSaturday} onChange={() => onChange({ showSaturday: !settings.showSaturday })} />
      </SettingRow>
    </Panel>
  );
}

export default function Settings() {
  const { schedule, updateSettings } = useSchedule();

  return (
    <div className="settings-page">
      <PageHeader title="Settings" description="Manage your profile, notifications and calendar preferences." />
      <NotificationSettings settings={schedule.settings} onChange={updateSettings} />
      <CalendarSettings settings={schedule.settings} onChange={updateSettings} />
    </div>
  );
}
