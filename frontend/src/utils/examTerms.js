export const EXAM_TERMS = [
  { value: "midterm", label: "Midterm 1" },
  { value: "midterm2", label: "Midterm 2" },
  { value: "final", label: "Final" },
];

export const EXAM_TERM_KEYS = EXAM_TERMS.map((term) => term.value);

export function examTermLabel(term) {
  return EXAM_TERMS.find((item) => item.value === term)?.label || "Exam";
}
