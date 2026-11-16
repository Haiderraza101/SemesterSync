import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "../../utils/cx.js";

const VIEWPORT_MARGIN = 8;

export default function Floating({
  anchorRef,
  open,
  onClose,
  matchWidth = false,
  offset = 4,
  align = "start",
  className,
  children,
  ...props
}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [position, setPosition] = useState({ top: -9999, left: -9999, side: "bottom" });

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open) return undefined;

    const update = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;

      const rect = anchor.getBoundingClientRect();
      const height = panel.offsetHeight;
      const width = matchWidth ? Math.max(rect.width, panel.offsetWidth) : panel.offsetWidth;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeTop = spaceBelow < height + offset + VIEWPORT_MARGIN && rect.top > spaceBelow;
      const top = placeTop ? rect.top - height - offset : rect.bottom + offset;
      const preferredLeft = align === "end" ? rect.right - width : rect.left;
      const left = Math.min(Math.max(VIEWPORT_MARGIN, preferredLeft), window.innerWidth - width - VIEWPORT_MARGIN);

      setPosition({
        top: Math.max(VIEWPORT_MARGIN, top),
        left,
        width: matchWidth ? rect.width : undefined,
        side: placeTop ? "top" : "bottom",
      });
    };

    update();
    const observer = new ResizeObserver(update);
    if (panelRef.current) observer.observe(panelRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, matchWidth, offset, align]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (event) => {
      if (panelRef.current?.contains(event.target) || anchorRef.current?.contains(event.target)) return;
      onCloseRef.current?.();
    };
    const handleKey = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onCloseRef.current?.({ restoreFocus: true });
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [open, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={cx("ui-popover", className)}
      data-side={position.side}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        "--ui-origin": position.side === "top" ? "bottom" : "top",
      }}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}
