import Checkbox from "../ui/Checkbox.jsx";
import CourseCell from "./CourseCell.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { cx } from "../../utils/cx.js";
import { getSlotKey } from "../../utils/clashes.js";
import { SHORT_DAY_NAMES, formatTime } from "../../utils/date.js";

export default function SectionTable({ courses, draft, clashingSlots, onToggle, onSectionChange }) {
  if (courses.length === 0) {
    return <EmptyState icon="search" title="No courses match your search" />;
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
            const sectionOptions = Object.keys(course.sections);
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
                  <CourseCell color={course.color} name={course.name} meta={course.code} />
                </td>
                <td>
                  <label className="sr-only" htmlFor={`section-${course.code}`}>
                    Section for {course.name}
                  </label>
                  <select
                    id={`section-${course.code}`}
                    className="select section-table__select"
                    value={entry.section}
                    onChange={(event) => onSectionChange(course.code, event.target.value)}
                  >
                    {sectionOptions.map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="slot-list">
                    {details.slots.map((slot) => {
                      const clashing = entry.included && clashingSlots.has(getSlotKey(course.code, slot));
                      return (
                        <span key={`${slot.day}-${slot.start}`} className={cx("slot-chip", clashing && "slot-chip--clash")}>
                          {SHORT_DAY_NAMES[slot.day]} {formatTime(slot.start).replace(/ (AM|PM)$/, "")}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td>{details.room}</td>
                <td>{details.instructor}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
