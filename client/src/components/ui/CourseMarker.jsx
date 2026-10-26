export default function CourseMarker({ color, size = 8 }) {
  return <span className="course-marker" style={{ width: size, height: size, background: color }} aria-hidden="true" />;
}
