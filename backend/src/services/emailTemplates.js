function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function passwordResetEmail({ name, resetUrl }) {
  const subject = "Reset your SemesterSync password";
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your SemesterSync password.",
    `Open this link to choose a new password: ${resetUrl}`,
    "",
    "The link expires in 30 minutes. If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>We received a request to reset your SemesterSync password.</p>
    <p><a href="${escapeHtml(resetUrl)}">Choose a new password</a></p>
    <p>The link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
  `;

  return { subject, text, html };
}
