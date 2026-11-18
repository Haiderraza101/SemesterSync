import { useRef, useState } from "react";
import { cx } from "../../utils/cx.js";
import Floating from "../ui/Floating.jsx";
import Icon from "../ui/Icon.jsx";

const STATUS_ICONS = {
  class: "calendar",
  makeup: "plus",
  cancelled: "close",
  clash: "alert",
  exam: "datesheets",
  task: "tasks",
};

const ULTRA_SHORT_HEIGHT = 45;
const SHORT_HEIGHT = 85;

export function formatCardTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}

export default function EventCard({ item, style, height, selected, onSelect, compact = false }) {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const ultraShort = !compact && height < ULTRA_SHORT_HEIGHT;
  const short = compact || height < SHORT_HEIGHT;
  const timeRange = `${formatCardTime(item.start)} - ${formatCardTime(item.end)}`;
  const icon = STATUS_ICONS[item.variant] || STATUS_ICONS[item.type] || "calendar";

  return (
    <>
      <button
        ref={cardRef}
        type="button"
        className={cx(
          "cal-card",
          `cal-card--${item.variant}`,
          ultraShort ? "cal-card--ultra" : short ? "cal-card--short" : "cal-card--tall",
          compact && "cal-card--compact",
          selected && "cal-card--selected",
          hovered && "cal-card--hovered"
        )}
        style={{ backgroundColor: item.color, ...style }}
        aria-label={`${item.title}, ${timeRange}, ${item.status}`}
        aria-pressed={selected}
        onClick={() => {
          setHovered(false);
          onSelect?.(item.id);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <span className="cal-card__body">
          <span className="cal-card__heading">
            <span className="cal-card__title">{compact ? item.shortTitle : item.title}</span>
            {!short && <span className="cal-card__time">{timeRange}</span>}
            {compact && <span className="cal-card__time">{formatCardTime(item.start)}</span>}
          </span>
          {!compact && (
            <span className="cal-card__footer">
              {ultraShort ? (
                <span className="cal-card__icon">
                  <Icon name={icon} size={12} strokeWidth={3} />
                </span>
              ) : (
                <span className="cal-card__pill">
                  <Icon name={icon} size={short ? 9 : 12} strokeWidth={3} />
                  <span>{item.status}</span>
                </span>
              )}
            </span>
          )}
        </span>
      </button>
      <Floating
        anchorRef={cardRef}
        open={hovered}
        placement="side"
        offset={8}
        closeOnOutside={false}
        className="cal-hovercard"
        style={{ backgroundColor: item.color }}
        role="tooltip"
      >
        <div className="cal-hovercard__header">
          <span className="cal-hovercard__icon">
            <Icon name={icon} size={12} strokeWidth={3} />
          </span>
          <span className="cal-hovercard__kind">{item.status}</span>
        </div>
        <dl className="cal-hovercard__rows">
          <div>
            <dt>{item.type === "task" ? "Task" : "Course"}</dt>
            <dd>{item.title}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{timeRange}</dd>
          </div>
          {item.place && (
            <div>
              <dt>{item.type === "task" ? "Course" : item.type === "exam" ? "Venue" : "Room"}</dt>
              <dd>{item.place}</dd>
            </div>
          )}
          {item.section && (
            <div className="cal-hovercard__divider">
              <dt>Section</dt>
              <dd>{item.section}</dd>
            </div>
          )}
        </dl>
      </Floating>
    </>
  );
}
