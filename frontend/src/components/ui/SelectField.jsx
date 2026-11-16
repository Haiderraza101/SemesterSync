import { forwardRef, useId } from "react";
import { cx } from "../../utils/cx.js";
import Select from "./Select.jsx";

const SelectField = forwardRef(function SelectField(
  { label, options, hint, error, hideLabel = false, inline = false, id, name, className, value, onChange, ...selectProps },
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
      <Select
        ref={ref}
        id={selectId}
        value={value}
        options={options}
        invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        onChange={(next) => onChange?.({ target: { name, value: next } })}
        {...selectProps}
      />
      {message && (
        <p id={messageId} className={error ? "field__error" : "field__hint"}>
          {message}
        </p>
      )}
    </div>
  );
});

export default SelectField;
