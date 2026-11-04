import AppError from "../utils/AppError.js";

export const validate = (validator) => (req, res, next) => {
  const errors = validator(req.body || {});
  const messages = Object.values(errors);
  if (messages.length > 0) {
    return next(new AppError(messages[0], 400, errors));
  }
  return next();
};
