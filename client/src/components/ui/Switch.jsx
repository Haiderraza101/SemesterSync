import { cx } from "../../utils/cx.js";

export default function Switch({ checked, onChange, label, id, disabled = false }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cx("switch", checked && "switch--on")}
      onClick={() => onChange(!checked)}
    >
      <span className="switch__thumb" />
    </button>
  );
}
