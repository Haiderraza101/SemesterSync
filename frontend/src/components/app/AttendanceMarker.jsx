import { cx } from "../../utils/cx.js";
import Icon from "../ui/Icon.jsx";

export const MARK_OPTIONS = [
  { value: "present", label: "Present", icon: "check" },
  { value: "late", label: "Late", icon: "clock" },
  { value: "absent", label: "Absent", icon: "close" },
];

export default function AttendanceMarker({ value, onChange, label, block = false, size = "md" }) {
  return (
    <div role="group" aria-label={label} className={cx("mark-picker", block && "mark-picker--block", `mark-picker--${size}`)}>
      {MARK_OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            className={cx("mark-picker__option", active && `mark-picker__option--${option.value}`)}
            onClick={() => onChange(active ? null : option.value)}
          >
            <Icon name={option.icon} size={13} strokeWidth={2.5} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
