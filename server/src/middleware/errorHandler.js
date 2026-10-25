export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  const status = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(status).json({ message: err.message });
};
