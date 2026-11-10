import AppError from "../utils/AppError.js";

const REQUEST_PARTS = ["params", "query", "body"];

function collectIssues(issues, part) {
  return issues.reduce((errors, issue) => {
    const key =
      issue.code === "unrecognized_keys" ? issue.keys.join(", ") : issue.path.length > 0 ? issue.path.join(".") : part;
    if (!errors[key]) errors[key] = issue.message;
    return errors;
  }, {});
}

export const validate = (schemas) => (req, res, next) => {
  let errors = {};

  REQUEST_PARTS.filter((part) => schemas[part]).forEach((part) => {
    const result = schemas[part].safeParse(req[part] ?? {});
    if (result.success) {
      req[part] = result.data;
    } else {
      errors = { ...errors, ...collectIssues(result.error.issues, part) };
    }
  });

  const messages = Object.values(errors);
  if (messages.length > 0) {
    return next(new AppError(messages[0], 400, { code: "VALIDATION_FAILED", details: errors }));
  }
  return next();
};
