import { isNonEmptyString } from "./common.js";

export function shareValidator(body) {
  if (!Array.isArray(body.selections) || body.selections.length === 0) {
    return { selections: "Select at least one course before sharing." };
  }

  const invalid = body.selections.some(
    (selection) => !selection || !isNonEmptyString(selection.code) || !isNonEmptyString(selection.section)
  );
  return invalid ? { selections: "Each course needs a code and a section." } : {};
}
