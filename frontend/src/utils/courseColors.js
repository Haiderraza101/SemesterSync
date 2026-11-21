export const COURSE_PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6"];

const LAB_SUFFIX = /[\s\-–(]*\blab(oratory)?\)?\s*$/i;

export function courseFamily(name) {
  return name.replace(LAB_SUFFIX, "").trim().toLowerCase();
}

export function assignCourseColors(courses) {
  const families = [...new Set(courses.map((course) => courseFamily(course.name)))].sort();
  const colors = new Map(families.map((family, index) => [family, COURSE_PALETTE[index % COURSE_PALETTE.length]]));
  return new Map(courses.map((course) => [course.code, colors.get(courseFamily(course.name))]));
}
