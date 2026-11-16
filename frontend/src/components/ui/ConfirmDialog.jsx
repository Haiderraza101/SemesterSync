import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon.jsx";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const panelRef = useRef(null);
  const handlers = useRef({ onConfirm, onCancel, busy });
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    handlers.current = { onConfirm, onCancel, busy };
  }, [onConfirm, onCancel, busy]);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    panelRef.current?.querySelector("[data-cancel]")?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") handlers.current.onCancel?.();
      if (event.key === "Enter" && !handlers.current.busy && event.target?.tagName !== "BUTTON") {
        event.preventDefault();
        handlers.current.onConfirm?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="ui-overlay" onMouseDown={() => handlers.current.onCancel?.()} />
      <div
        ref={panelRef}
        className="ui-dialog alert-dialog-wrap"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="alert-dialog">
          <div className="alert-dialog__header">
            <span className={destructive ? "alert-dialog__media alert-dialog__media--danger" : "alert-dialog__media"}>
              <Icon name={destructive ? "trash" : "alert"} size={22} />
            </span>
            <h2 id={titleId} className="alert-dialog__title">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="alert-dialog__description">
                {description}
              </p>
            )}
          </div>
          <div className="alert-dialog__footer">
            <button type="button" className="modal-secondary" data-cancel onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className={destructive ? "modal-submit modal-submit--danger" : "modal-submit"}
              disabled={busy}
              onClick={onConfirm}
            >
              <span>{busy ? "Processing..." : confirmLabel}</span>
              {!busy && <Icon name="enter" size={16} strokeWidth={3} />}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
