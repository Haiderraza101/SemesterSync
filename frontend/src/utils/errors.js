export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  return error.response?.data?.message || error.message || fallback;
}
