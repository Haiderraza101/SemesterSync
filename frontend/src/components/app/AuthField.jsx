import { forwardRef, useId, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { cx } from "../../utils/cx.js";

const AuthField = forwardRef(function AuthField(
  { label, icon, hint, error, labelAction, type = "text", id, children, ...inputProps },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const message = error || hint;

  return (
    <div className="auth-field">
      <div className="auth-field__label-row">
        <label htmlFor={inputId} className="auth-field__label">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="auth-field__control">
        {icon && (
          <span className="auth-field__icon" aria-hidden="true">
            <Icon name={icon} size={16} strokeWidth={2} />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && visible ? "text" : type}
          className={cx("auth-field__input", icon && "auth-field__input--icon", isPassword && "auth-field__input--toggle", error && "auth-field__input--invalid")}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-field__toggle"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            <Icon name={visible ? "eye-off" : "eye"} size={16} strokeWidth={2} />
          </button>
        )}
      </div>
      {children}
      {message && (
        <p id={messageId} className={error ? "auth-field__error" : "auth-field__hint"}>
          {message}
        </p>
      )}
    </div>
  );
});

export default AuthField;
