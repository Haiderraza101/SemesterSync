import { z } from "zod";

const SELECT_MESSAGE = "Select at least one course before sharing.";
const SELECTION_MESSAGE = "Each course needs a code and a section.";
const EXAM_MESSAGE = "Each shared exam needs a course, date and time.";
const TASK_MESSAGE = "Each shared task needs a title and a due date.";
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const selectionText = z
  .string({ required_error: SELECTION_MESSAGE, invalid_type_error: SELECTION_MESSAGE })
  .trim()
  .min(1, SELECTION_MESSAGE)
  .max(40, SELECTION_MESSAGE);

const examSchema = z.object(
  {
    term: z.enum(["midterm", "final"], { errorMap: () => ({ message: EXAM_MESSAGE }) }),
    code: z.string({ required_error: EXAM_MESSAGE }).trim().min(1, EXAM_MESSAGE).max(40),
    date: z.string({ required_error: EXAM_MESSAGE }).regex(DATE_PATTERN, EXAM_MESSAGE),
    start: z.string({ required_error: EXAM_MESSAGE }).regex(TIME_PATTERN, EXAM_MESSAGE),
    end: z.string({ required_error: EXAM_MESSAGE }).regex(TIME_PATTERN, EXAM_MESSAGE),
    venue: z.string().trim().max(80).optional().default(""),
  },
  { invalid_type_error: EXAM_MESSAGE }
);

const taskSchema = z.object(
  {
    title: z.string({ required_error: TASK_MESSAGE }).trim().min(1, TASK_MESSAGE).max(120),
    courseCode: z.string().trim().max(40).optional().default(""),
    type: z.enum(["assignment", "quiz"]).optional().default("assignment"),
    due: z.string({ required_error: TASK_MESSAGE }).trim().min(1, TASK_MESSAGE).max(40),
  },
  { invalid_type_error: TASK_MESSAGE }
);

export const shareSchema = z.object({
  selections: z
    .array(
      z.object(
        { code: selectionText, section: selectionText },
        { required_error: SELECTION_MESSAGE, invalid_type_error: SELECTION_MESSAGE }
      ),
      { required_error: SELECT_MESSAGE, invalid_type_error: SELECT_MESSAGE }
    )
    .min(1, SELECT_MESSAGE)
    .max(50, "A shared schedule can include at most 50 courses."),
  exams: z.array(examSchema).max(100, "A shared schedule can include at most 100 exams.").optional().default([]),
  tasks: z.array(taskSchema).max(200, "A shared schedule can include at most 200 tasks.").optional().default([]),
});
