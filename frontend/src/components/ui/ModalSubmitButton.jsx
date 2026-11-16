import { cx } from "../../utils/cx.js";
import Icon from "./Icon.jsx";

export default function ModalSubmitButton({
  label,
  busyLabel = "Processing...",
  busy = false,
  formId,
  onClick,
  disabled = false,
  variant = "default",
  className,
}) {
  return (
    <button
      type={formId ? "submit" : "button"}
      form={formId}
      onClick={onClick}
      disabled={disabled || busy}
      className={cx("modal-submit", variant === "danger" && "modal-submit--danger", className)}
    >
      <span>{busy ? busyLabel : label}</span>
      {!busy && <Icon name="enter" size={16} strokeWidth={3} />}
    </button>
  );
}
