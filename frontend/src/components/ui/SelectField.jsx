import { forwardRef, useId } from "react";
import { cx } from "../../utils/cx.js";

const SelectField = forwardRef(function SelectField(
  { label, options, hint, error, hideLabel = false, inline = false, id, className, ...selectProps },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const messageId = `${selectId}-message`;
  const message = error || hint;

  return (
    <div className={cx("field", inline && "field--inline", className)}>
      <label htmlFor={selectId} className={cx("field__label", hideLabel && "sr-only")}>
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        className={cx("select", error && "input--invalid")}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {message && (
        <p id={messageId} className={error ? "field__error" : "field__hint"}>
          {message}
        </p>
      )}
    </div>
  );
});

export default SelectField;
