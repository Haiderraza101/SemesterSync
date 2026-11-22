import { useState } from "react";
import Button from "../ui/Button.jsx";
import Icon from "../ui/Icon.jsx";
import { groupClashes } from "../../utils/clashes.js";
import { SHORT_DAY_NAMES, formatTime } from "../../utils/date.js";

const VISIBLE_ROWS = 3;

function formatTimes(times) {
  const byStart = new Map();
  times.forEach((time) => byStart.set(time.start, [...(byStart.get(time.start) || []), time.day]));
  return [...byStart.entries()]
    .map(([start, days]) => `${days.map((day) => SHORT_DAY_NAMES[day]).join(", ")} · ${formatTime(start)}`)
    .join("  /  ");
}

function ClashCourse({ course }) {
  return (
    <span className="clash-banner__course">
      <span className="clash-banner__dot" style={{ background: course.color }} />
      <span className="clash-banner__course-name">{course.name}</span>
      <span className="clash-banner__section">{course.section}</span>
    </span>
  );
}

const DEFAULT_TEXT = "You can only attend one class at a time. Pick another section for one of the courses on the timetable page.";

export default function ClashBanner({ clashes, text = DEFAULT_TEXT, showAction = true }) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupClashes(clashes);
  const visible = expanded ? groups : groups.slice(0, VISIBLE_ROWS);
  const hidden = groups.length - VISIBLE_ROWS;

  return (
    <section className="clash-banner" role="alert">
      <header className="clash-banner__header">
        <span className="clash-banner__icon" aria-hidden="true">
          <Icon name="alert" size={18} strokeWidth={2} />
        </span>
        <div className="clash-banner__heading">
          <h2 className="clash-banner__title">
            {groups.length === 1 ? "2 of your classes overlap" : `${groups.length} pairs of classes overlap`}
          </h2>
          <p className="clash-banner__text">{text}</p>
        </div>
        {showAction && (
          <Button size="sm" to="/app/timetable" className="clash-banner__action">
            Resolve in timetable
          </Button>
        )}
      </header>
      <ul className="clash-banner__list">
        {visible.map((group) => (
          <li key={group.id} className="clash-banner__row">
            <span className="clash-banner__when">{formatTimes(group.times)}</span>
            <span className="clash-banner__pair">
              <ClashCourse course={group.courses[0]} />
              <span className="clash-banner__versus">overlaps with</span>
              <ClashCourse course={group.courses[1]} />
            </span>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" className="clash-banner__toggle" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show less" : `Show ${hidden} more`}
          <Icon name={expanded ? "chevron-up" : "chevron-down"} size={14} strokeWidth={2} />
        </button>
      )}
    </section>
  );
}
