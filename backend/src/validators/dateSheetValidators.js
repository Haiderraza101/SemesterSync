import { z } from "zod";
import { EXAM_TERMS } from "../utils/examTerms.js";

export const dateSheetUploadSchema = z.object({
  term: z.enum(EXAM_TERMS, { errorMap: () => ({ message: "Choose Midterm 1, Midterm 2 or Final." }) }).optional(),
});
