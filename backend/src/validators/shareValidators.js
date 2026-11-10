import { z } from "zod";

const SELECT_MESSAGE = "Select at least one course before sharing.";
const SELECTION_MESSAGE = "Each course needs a code and a section.";

const selectionText = z
  .string({ required_error: SELECTION_MESSAGE, invalid_type_error: SELECTION_MESSAGE })
  .trim()
  .min(1, SELECTION_MESSAGE)
  .max(40, SELECTION_MESSAGE);

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
});
