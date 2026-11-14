export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request && !error.response) return "Could not reach the server. Check your connection and try again.";
  if (error.response?.status >= 500) return "The server is unavailable right now. Please try again in a moment.";
  return error.message || fallback;
}

export function getErrorCode(error) {
  return error?.response?.data?.code || null;
}

export function getFieldErrors(error) {
  return error?.response?.data?.errors || {};
}
