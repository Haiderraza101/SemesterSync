import { z } from "zod";

const includeSchema = z
  .object({
    exams: z.boolean().optional().default(true),
    tasks: z.boolean().optional().default(true),
    changes: z.boolean().optional().default(true),
  })
  .optional()
  .default({});

export const shareSchema = z.object({
  include: includeSchema,
  regenerate: z.boolean().optional().default(false),
});
