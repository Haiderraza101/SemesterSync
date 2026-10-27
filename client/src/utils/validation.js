const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value).trim());
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter your email.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

const ROLL_NUMBER_PATTERN = /^\d{2}[A-Z]-\d{4}$/i;

export function validatePassword(password) {
  if (!password) return "Enter a password.";
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/\d/.test(password)) return "Include at least one number.";
  return "";
}

export function validateRegister(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Enter your full name.";
  if (!values.rollNumber.trim()) errors.rollNumber = "Enter your roll number.";
  else if (!ROLL_NUMBER_PATTERN.test(values.rollNumber.trim())) errors.rollNumber = "Use the format 23L-0634.";
  if (!values.section.trim()) errors.section = "Enter your section.";
  if (!values.email.trim()) errors.email = "Enter your email.";
  else if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;
  if (!values.confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}
