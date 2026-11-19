import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const LECTURE_ID_PATTERN = /^[A-Za-z0-9_.:-]{3,120}$/;

export const lectureParamsSchema = z.object({
  lectureId: z.string().regex(LECTURE_ID_PATTERN, "This lecture could not be found."),
});

export const lectureFileParamsSchema = lectureParamsSchema.extend({
  fileId: z.string().regex(/^[a-f0-9]{24}$/i, "File not found."),
});

const lectureInfo = {
  courseCode: z.string({ required_error: "Course is required." }).trim().min(1).max(40),
  courseName: z.string().trim().max(160).optional().default(""),
  date: z.string({ required_error: "Date is required." }).regex(DATE_PATTERN, "Use the format YYYY-MM-DD."),
  start: z.string().regex(TIME_PATTERN, "Use the format HH:MM.").optional(),
};

const linkSchema = z.object({
  id: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1, "Give the link a title.").max(120),
  url: z
    .string()
    .trim()
    .max(2000)
    .url("Enter a full link, starting with https://")
    .refine((value) => /^https?:\/\//i.test(value), "Links must start with http:// or https://"),
});

export const lectureUpdateSchema = z.object({
  ...lectureInfo,
  notes: z.string().max(20000, "Notes can be at most 20,000 characters.").optional(),
  links: z.array(linkSchema).max(30, "A lecture can have at most 30 links.").optional(),
});

export const lectureFileBodySchema = z.object(lectureInfo);

export const lectureListQuerySchema = z.object({
  course: z.string({ required_error: "Choose a course." }).trim().min(1).max(40),
});
