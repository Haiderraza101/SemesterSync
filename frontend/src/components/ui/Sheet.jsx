import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import Drawer from "./Drawer.jsx";
import Icon from "./Icon.jsx";

function SheetHeader({ title, titleId, onClose }) {
  return (
    <header className="modal__header">
      <h2 id={titleId} className="modal__title">
        {title}
      </h2>
      <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>
        <Icon name="close" size={20} strokeWidth={1.8} />
      </button>
    </header>
  );
}

export default function Sheet({ open, title, onClose, children }) {
  const isMobile = useIsMobile();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || isMobile) return undefined;
    const previouslyFocused = document.activeElement;
    panelRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, isMobile]);

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onClose={onClose} role="dialog" aria-labelledby={titleId}>
        <SheetHeader title={title} titleId={titleId} onClose={onClose} />
        <div className="ui-sheet__body scrollbar-premium">{children}</div>
      </Drawer>
    );
  }

  return createPortal(
    <>
      <div className="ui-overlay ui-overlay--light" onMouseDown={() => onCloseRef.current?.()} />
      <aside ref={panelRef} className="ui-sheet" role="dialog" aria-labelledby={titleId} tabIndex={-1}>
        <SheetHeader title={title} titleId={titleId} onClose={onClose} />
        <div className="ui-sheet__body scrollbar-premium">{children}</div>
      </aside>
    </>,
    document.body
  );
}
