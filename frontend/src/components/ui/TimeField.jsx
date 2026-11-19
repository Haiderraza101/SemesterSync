import { useId } from "react";
import { cx } from "../../utils/cx.js";
import TimePicker from "./TimePicker.jsx";

export default function TimeField({ label, hint, error, id, name, value, onChange, className, ...pickerProps }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;
  const message = error || hint;

  return (
    <div className={cx("field", className)}>
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
      <TimePicker
        id={inputId}
        value={value}
        invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        onChange={(next) => onChange?.({ target: { name, value: next } })}
        {...pickerProps}
      />
      {message && (
        <p id={messageId} className={error ? "field__error" : "field__hint"}>
          {message}
        </p>
      )}
    </div>
  );
}
