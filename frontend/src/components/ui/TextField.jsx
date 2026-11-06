import { forwardRef, useId } from "react";
import { cx } from "../../utils/cx.js";

const TextField = forwardRef(function TextField(
  { label, hint, error, labelAction, id, className, inputClassName, ...inputProps },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;
  const message = error || hint;

  return (
    <div className={cx("field", className)}>
      <div className="field__label-row">
        <label htmlFor={inputId} className="field__label">
          {label}
        </label>
        {labelAction}
      </div>
      <input
        ref={ref}
        id={inputId}
        className={cx("input", error && "input--invalid", inputClassName)}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...inputProps}
      />
      {message && (
        <p id={messageId} className={error ? "field__error" : "field__hint"}>
          {message}
        </p>
      )}
    </div>
  );
});

export default TextField;
