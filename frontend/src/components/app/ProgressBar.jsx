import { cx } from "../../utils/cx.js";

export default function ProgressBar({ value, label, tone = "default" }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cx("progress", tone !== "default" && `progress--${tone}`)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <div className="progress__bar" style={{ width: `${clamped}%` }} />
    </div>
  );
}
