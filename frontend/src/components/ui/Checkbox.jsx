import { cx } from "../../utils/cx.js";

export default function Checkbox({ label, className, hideLabel = false, ...inputProps }) {
  return (
    <label className={cx("checkbox", className)}>
      <input type="checkbox" className="checkbox__input" {...inputProps} />
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
    </label>
  );
}
