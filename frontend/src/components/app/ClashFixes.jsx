import { useState } from "react";
import Button from "../ui/Button.jsx";

const VISIBLE_OPTIONS = 3;

function joinNames(names) {
  if (names.length <= 1) return names[0] || "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function groupTitle(changes) {
  const moves = changes.filter((change) => change.kind === "move").map((change) => change.name);
  const swaps = changes.filter((change) => change.kind === "swap").map((change) => change.replacedName);
  const parts = [];
  if (moves.length) parts.push(`Move ${joinNames(moves)} to ${moves.length === 1 ? "another section" : "other sections"}`);
  if (swaps.length) parts.push(`replace ${joinNames(swaps)} with another elective`);
  const title = parts.join(" and ");
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function ChangeLine({ change, color, showName }) {
  return (
    <span className="clash-fix__change">
      <span className="clash-fix__dot" style={{ background: color || "#9ca3af" }} />
      {(showName || change.kind === "swap") && <span className="clash-fix__course">{change.name}</span>}
      <span className="clash-fix__section">{change.section}</span>
      <span className="clash-fix__when">{change.when}</span>
    </span>
  );
}

function FixGroup({ group, index, courseColors, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? group.options : group.options.slice(0, VISIBLE_OPTIONS);
  const hidden = group.options.length - VISIBLE_OPTIONS;
  const multiple = group.changes.length > 1;

  return (
    <li className="clash-fix">
      <div className="clash-fix__head">
        <span className="clash-fix__number">{index + 1}</span>
        <span className="clash-fix__title">{groupTitle(group.changes)}</span>
        <span className="clash-fix__badge">
          {group.changes.length} {group.changes.length === 1 ? "change" : "changes"}
        </span>
      </div>
      <ul className="clash-fix__options">
        {visible.map((option) => (
          <li key={option.id} className="clash-fix__option">
            <span className="clash-fix__changes">
              {option.changes.map((change) => (
                <ChangeLine
                  key={`${change.from}-${change.code}`}
                  change={change}
                  color={courseColors?.get(change.code)}
                  showName={multiple}
                />
              ))}
            </span>
            <Button size="sm" onClick={() => onApply(option)}>
              Apply
            </Button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" className="clash-fix__more" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show fewer" : `Show ${hidden} more ${hidden === 1 ? "option" : "options"}`}
        </button>
      )}
    </li>
  );
}

export default function ClashFixes({ result, courseColors, onApply }) {
  if (result.groups.length === 0) {
    return (
      <div className="clash-fixes clash-fixes--empty">
        No combination of sections removes every clash. Try unticking one of the clashing courses instead.
      </div>
    );
  }

  return (
    <div className="clash-fixes">
      <p className="clash-fixes__intro">
        {result.exhausted ? "Many" : result.total} {result.total === 1 ? "combination" : "combinations"} remove every clash.
        The simplest ones are first.
      </p>
      <ol className="clash-fixes__list">
        {result.groups.map((group, index) => (
          <FixGroup key={group.id} group={group} index={index} courseColors={courseColors} onApply={onApply} />
        ))}
      </ol>
    </div>
  );
}
