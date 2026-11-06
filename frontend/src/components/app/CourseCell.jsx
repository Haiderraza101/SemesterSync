import CourseMarker from "../ui/CourseMarker.jsx";

export default function CourseCell({ color, name, meta }) {
  return (
    <div className="course-cell">
      <CourseMarker color={color} />
      <div className="course-cell__text">
        <span className="course-cell__name">{name}</span>
        {meta && <span className="course-cell__meta">{meta}</span>}
      </div>
    </div>
  );
}
