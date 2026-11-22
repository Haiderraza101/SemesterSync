import Button from "../ui/Button.jsx";
import Checkbox from "../ui/Checkbox.jsx";
import CourseCell from "./CourseCell.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Select from "../ui/Select.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import { cx } from "../../utils/cx.js";
import { getSlotKey } from "../../utils/clashes.js";
import { SHORT_DAY_NAMES, formatTime } from "../../utils/date.js";

export default function SectionTable({
  courses,
  courseColors,
  onResetFilters,
  draft,
  sectionOptions,
  clashingSlots,
  onToggle,
  onSectionChange,
}) {
  if (courses.length === 0) {
    return (
      <EmptyState
        variant="compact"
        icon="search"
        title="No courses match your search and filters"
        action={onResetFilters && <Button onClick={onResetFilters}>Reset filters</Button>}
      />
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table section-table">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Include</span>
            </th>
            <th scope="col">Course</th>
            <th scope="col">Type</th>
            <th scope="col">Section</th>
            <th scope="col">Timings</th>
            <th scope="col">Room</th>
            <th scope="col">Instructor</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => {
            const entry = draft[course.code];
            const details = course.sections[entry.section];
            const options = sectionOptions.get(course.code);
            return (
              <tr key={course.code} className={cx(!entry.included && "section-table__row--off")}>
                <td>
                  <Checkbox
                    label={`Include ${course.name}`}
                    hideLabel
                    checked={entry.included}
                    onChange={() => onToggle(course.code)}
                  />
                </td>
                <td>
                  <CourseCell
                    color={courseColors?.get(course.code) || course.color}
                    name={course.name}
                    meta={course.kind === "lab" ? `${course.code} · Lab` : course.code}
                  />
                </td>
                <td>
                  <StatusBadge status={details.type || "core"} />
                </td>
                <td>
                  <Select
                    id={`section-${course.code}`}
                    size="sm"
                    className="section-table__select"
                    aria-label={`Section for ${course.name}`}
                    value={entry.section}
                    options={options.map((section) => ({ value: section, label: section }))}
                    onChange={(section) => onSectionChange(course.code, section)}
                  />
                </td>
                <td>
                  <div className="slot-list">
                    {details.slots.map((slot) => {
                      const clashing = entry.included && clashingSlots.has(getSlotKey(course.code, slot));
                      return (
                        <span
                          key={`${slot.day}-${slot.start}`}
                          className={cx("slot-chip", clashing && "slot-chip--clash")}
                        >
                          {SHORT_DAY_NAMES[slot.day]} {formatTime(slot.start).replace(/ (AM|PM)$/, "")}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="cell-muted">{details.room}</td>
                <td className="cell-muted">{details.instructor || <span className="cell-empty-dash">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
