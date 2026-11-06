import { cx } from "../../utils/cx.js";

export default function SegmentedControl({ options, value, onChange, label, block = false, className }) {
  return (
    <div role="group" aria-label={label} className={cx("segmented", block && "segmented--block", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            className={cx("segmented__option", active && "segmented__option--active")}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
