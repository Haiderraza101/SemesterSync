import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { cx } from "../../utils/cx.js";
import Icon from "./Icon.jsx";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function trapFocus(event, container) {
  if (event.key !== "Tab" || !container) return;
  const items = [...container.querySelectorAll(FOCUSABLE)].filter((item) => item.offsetParent !== null);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export default function Modal({
  open,
  title,
  parent,
  description,
  onClose,
  footer,
  size = "sm",
  className,
  children,
}) {
  const isMobile = useIsMobile();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstField = panelRef.current?.querySelector(".modal__body input, .modal__body button");
    (firstField || panelRef.current)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
      trapFocus(event, panelRef.current);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="ui-overlay" onMouseDown={() => onCloseRef.current?.()} />
      <div
        ref={panelRef}
        className={cx(isMobile ? "ui-drawer" : cx("ui-dialog", `ui-dialog--${size}`), className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        {isMobile && <div className="ui-drawer__handle" aria-hidden="true" />}
        <header className="modal__header">
          <nav className="modal__crumbs" aria-label="Breadcrumb">
            {parent && (
              <>
                <span className="modal__parent">{parent}</span>
                <span className="modal__separator" aria-hidden="true">
                  <Icon name="chevron-right" size={14} strokeWidth={2} />
                </span>
              </>
            )}
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
          </nav>
          <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={20} strokeWidth={1.8} />
          </button>
        </header>
        {description && (
          <p id={descriptionId} className="modal__description">
            {description}
          </p>
        )}
        <div className="modal__body scrollbar-premium">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </>,
    document.body
  );
}
