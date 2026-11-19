import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { cx } from "../../utils/cx.js";
import Drawer from "./Drawer.jsx";
import Floating from "./Floating.jsx";
import Icon from "./Icon.jsx";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function parseTime(value) {
  if (!TIME_PATTERN.test(value || "")) return { hour: 9, minute: 0, empty: true };
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute, empty: false };
}

function formatTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function TimeColumn({ label, values, selected, onPick, selectedRef }) {
  return (
    <div className="time-picker__column">
      <div className="time-picker__label">{label}</div>
      <div className="time-picker__list" role="listbox" aria-label={label}>
        {values.map((value) => (
          <button
            key={value}
            ref={value === selected ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={value === selected}
            className={cx("time-picker__option", value === selected && "time-picker__option--selected")}
            onClick={() => onPick(value)}
          >
            {String(value).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}

const TimePicker = forwardRef(function TimePicker(
  { id, value, onChange, placeholder = "hh:mm", invalid = false, disabled = false, className, ...ariaProps },
  ref
) {
  const isMobile = useIsMobile();
  const anchorRef = useRef(null);
  const inputRef = useRef(null);
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { hour, minute, empty } = parseTime(value);

  useImperativeHandle(ref, () => inputRef.current);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => {
      hourRef.current?.scrollIntoView({ block: "nearest" });
      minuteRef.current?.scrollIntoView({ block: "nearest" });
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  const close = ({ restoreFocus = false } = {}) => {
    setOpen(false);
    if (restoreFocus) inputRef.current?.focus();
  };

  const content = (
    <div className="time-picker">
      <TimeColumn
        label="Hour"
        values={HOURS}
        selected={empty ? null : hour}
        selectedRef={hourRef}
        onPick={(nextHour) => onChange?.(formatTime(nextHour, minute))}
      />
      <TimeColumn
        label="Min"
        values={MINUTES}
        selected={empty ? null : minute}
        selectedRef={minuteRef}
        onPick={(nextMinute) => {
          onChange?.(formatTime(hour, nextMinute));
          close({ restoreFocus: !isMobile });
        }}
      />
    </div>
  );

  return (
    <div ref={anchorRef} className={cx("ui-datepicker", className)}>
      <input
        ref={inputRef}
        id={id}
        readOnly
        disabled={disabled}
        placeholder={placeholder}
        value={empty ? "" : formatTime(hour, minute)}
        className={cx("ui-datepicker__input", invalid && "ui-datepicker__input--invalid")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (["Enter", " ", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        {...ariaProps}
      />
      <span className="ui-datepicker__icon" aria-hidden="true">
        <Icon name="clock" size={18} strokeWidth={2} />
      </span>
      {isMobile ? (
        <Drawer open={open} onClose={() => close()} role="dialog" aria-label="Choose a time">
          <div className="time-picker-drawer">{content}</div>
        </Drawer>
      ) : (
        <Floating
          anchorRef={anchorRef}
          open={open}
          onClose={close}
          offset={8}
          className="time-picker-popover"
          role="dialog"
          aria-label="Choose a time"
        >
          {content}
        </Floating>
      )}
    </div>
  );
});

export default TimePicker;
