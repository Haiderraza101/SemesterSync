import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cx } from "../../utils/cx.js";

export default function Drawer({ open, onClose, className, children, ...props }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const handleKey = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="ui-overlay" onMouseDown={() => onCloseRef.current?.()} />
      <div ref={panelRef} className={cx("ui-drawer", className)} tabIndex={-1} {...props}>
        <div className="ui-drawer__handle" aria-hidden="true" />
        {children}
      </div>
    </>,
    document.body
  );
}
