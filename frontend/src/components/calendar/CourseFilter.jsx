import Checkbox from "../ui/Checkbox.jsx";
import CourseMarker from "../ui/CourseMarker.jsx";
import Panel from "../ui/Panel.jsx";

export default function CourseFilter({ courses, hiddenCodes, onToggle }) {
  return (
    <Panel title="Courses">
      <ul className="course-filter">
        {courses.map((course) => (
          <li key={course.code}>
            <Checkbox
              checked={!hiddenCodes.has(course.code)}
              onChange={() => onToggle(course.code)}
              label={
                <span className="course-filter__label">
                  <CourseMarker color={course.color} />
                  {course.name}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
