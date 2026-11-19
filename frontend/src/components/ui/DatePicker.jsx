import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { cx } from "../../utils/cx.js";
import { parseDateKey, toDateKey } from "../../utils/date.js";
import PeriodPicker from "../calendar/PeriodPicker.jsx";
import Drawer from "./Drawer.jsx";
import Floating from "./Floating.jsx";
import Icon from "./Icon.jsx";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatDisplay(key) {
  if (!DATE_KEY_PATTERN.test(key || "")) return "";
  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
}

const DatePicker = forwardRef(function DatePicker(
  { id, value, onChange, min, max, placeholder = "dd/mm/yyyy", invalid = false, disabled = false, className, ...ariaProps },
  ref
) {
  const isMobile = useIsMobile();
  const anchorRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => inputRef.current);

  const close = ({ restoreFocus = false } = {}) => {
    setOpen(false);
    if (restoreFocus) inputRef.current?.focus();
  };

  const handleSelect = (date) => {
    onChange?.(toDateKey(date));
    close({ restoreFocus: !isMobile });
  };

  const handleKeyDown = (event) => {
    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onChange?.("");
    }
  };

  const picker = (
    <PeriodPicker
      mode="day"
      value={DATE_KEY_PATTERN.test(value || "") ? parseDateKey(value) : null}
      min={min}
      max={max}
      onSelect={handleSelect}
    />
  );

  return (
    <div ref={anchorRef} className={cx("ui-datepicker", className)}>
      <input
        ref={inputRef}
        id={id}
        readOnly
        disabled={disabled}
        placeholder={placeholder}
        value={formatDisplay(value)}
        className={cx("ui-datepicker__input", invalid && "ui-datepicker__input--invalid")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        {...ariaProps}
      />
      <span className="ui-datepicker__icon" aria-hidden="true">
        <Icon name="calendar" size={18} strokeWidth={2} />
      </span>
      {isMobile ? (
        <Drawer open={open} onClose={() => close()} role="dialog" aria-label="Choose a date" className="ui-drawer--picker">
          {picker}
        </Drawer>
      ) : (
        <Floating
          anchorRef={anchorRef}
          open={open}
          onClose={close}
          offset={8}
          className="period-picker-popover"
          role="dialog"
          aria-label="Choose a date"
        >
          {picker}
        </Floating>
      )}
    </div>
  );
});

export default DatePicker;
