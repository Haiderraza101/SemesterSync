import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { cx } from "../../utils/cx.js";
import Floating from "./Floating.jsx";
import Icon from "./Icon.jsx";

function sameValue(a, b) {
  return String(a) === String(b);
}

const Select = forwardRef(function Select(
  {
    id,
    value,
    options,
    onChange,
    placeholder = "Select…",
    size = "default",
    searchable = true,
    disabled = false,
    invalid = false,
    className,
    ...ariaProps
  },
  ref
) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const listId = `${triggerId}-list`;
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useImperativeHandle(ref, () => triggerRef.current);

  const selected = options.find((option) => sameValue(option.value, value));
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => String(option.label).toLowerCase().includes(term));
  }, [options, query]);

  const openList = () => {
    if (disabled) return;
    const index = options.findIndex((option) => sameValue(option.value, value));
    setQuery("");
    setActiveIndex(Math.max(0, index));
    setOpen(true);
  };

  const closeList = ({ restoreFocus = false } = {}) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) triggerRef.current?.focus();
  };

  const choose = (option) => {
    if (!option) return;
    if (!sameValue(option.value, value)) onChange?.(option.value);
    closeList({ restoreFocus: true });
  };

  useEffect(() => {
    if (!open) return;
    if (searchable) searchRef.current?.focus();
    else listRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIndex]);

  const handleListKeys = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(filtered.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(filtered[activeIndex]);
    } else if (event.key === "Tab") {
      closeList();
    }
  };

  const handleTriggerKeys = (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openList();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={cx("ui-select", size === "sm" && "ui-select--sm", invalid && "ui-select--invalid", className)}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={handleTriggerKeys}
        {...ariaProps}
      >
        <span className={cx("ui-select__value", !selected && "ui-select__value--placeholder")}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="unfold" size={16} strokeWidth={2} className="ui-select__icon" />
      </button>
      <Floating anchorRef={triggerRef} open={open} onClose={closeList} matchWidth className="ui-listbox">
        {searchable && (
          <div className="ui-listbox__search">
            <input
              ref={searchRef}
              placeholder="Search..."
              value={query}
              aria-label="Search options"
              aria-controls={listId}
              aria-activedescendant={filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleListKeys}
            />
          </div>
        )}
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={searchable ? -1 : 0}
          aria-labelledby={triggerId}
          className="ui-listbox__list scrollbar-premium"
          onKeyDown={searchable ? undefined : handleListKeys}
        >
          {filtered.length === 0 ? (
            <div className="ui-listbox__empty">No results</div>
          ) : (
            filtered.map((option, index) => {
              const isSelected = sameValue(option.value, value);
              return (
                <div
                  key={option.value}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  className={cx("ui-listbox__option", index === activeIndex && "is-active")}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  <span className="ui-listbox__option-label">{option.label}</span>
                  {isSelected && (
                    <span className="ui-listbox__check">
                      <Icon name="check" size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Floating>
    </>
  );
});

export default Select;
