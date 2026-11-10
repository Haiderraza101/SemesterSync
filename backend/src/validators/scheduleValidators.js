import { z } from "zod";

const list = (field) => z.array(z.any(), { invalid_type_error: `${field} must be a list.` }).optional();
const record = (field) => z.record(z.any(), { invalid_type_error: `${field} must be an object.` }).optional();

export const scheduleSchema = z
  .object({
    catalog: z
      .object(
        { courses: z.array(z.any(), { required_error: "catalog must include a list of courses." }) },
        { invalid_type_error: "catalog must include a list of courses." }
      )
      .passthrough()
      .nullable()
      .optional(),
    selections: list("selections"),
    cancelled: list("cancelled"),
    makeups: list("makeups"),
    tasks: list("tasks"),
    dateSheets: record("dateSheets"),
    attendance: record("attendance"),
    settings: record("settings"),
  })
  .strict("This field cannot be updated.")
  .refine((body) => Object.keys(body).length > 0, {
    message: "Provide at least one field to update.",
    path: ["schedule"],
  });
