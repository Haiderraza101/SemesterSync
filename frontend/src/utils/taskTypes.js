export const TASK_TYPES = [
  { value: "assignment", label: "Assignment", plural: "Assignments", placeholder: "Assignment 5" },
  { value: "quiz", label: "Quiz", plural: "Quizzes", placeholder: "Quiz 3" },
  { value: "evaluation", label: "Evaluation", plural: "Evaluations", placeholder: "Project demo, viva or presentation" },
];

export function taskTypeLabel(type) {
  return TASK_TYPES.find((item) => item.value === type)?.label || "Assignment";
}

export function countByType(tasks) {
  return TASK_TYPES.reduce((counts, item) => ({ ...counts, [item.value]: tasks.filter((task) => (task.type || "assignment") === item.value).length }), {});
}
