export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request && !error.response) return "Could not reach the server. Check your connection and try again.";
  return error.message || fallback;
}

export function getErrorCode(error) {
  return error?.response?.data?.code || null;
}

export function getFieldErrors(error) {
  return error?.response?.data?.errors || {};
}
