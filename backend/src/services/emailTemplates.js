function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(paragraphs) {
  const body = paragraphs.map((paragraph) => `<p style="margin:0 0 16px">${paragraph}</p>`).join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1f2933;max-width:520px">${body}<p style="margin:24px 0 0;color:#6b7280;font-size:13px">SemesterSync</p></div>`;
}

export function passwordResetEmail({ name, resetUrl, expiresInMinutes }) {
  const subject = "Reset your SemesterSync password";
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your SemesterSync password.",
    `Open this link to choose a new password: ${resetUrl}`,
    "",
    `The link expires in ${expiresInMinutes} minutes and can only be used once.`,
    "If you did not request this, you can ignore this email. Your password will not change.",
  ].join("\n");

  const html = layout([
    `Hi ${escapeHtml(name)},`,
    "We received a request to reset your SemesterSync password.",
    `<a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px">Choose a new password</a>`,
    `The link expires in ${expiresInMinutes} minutes and can only be used once.`,
    "If you did not request this, you can ignore this email. Your password will not change.",
  ]);

  return { subject, text, html };
}

export function passwordChangedEmail({ name, resetUrl }) {
  const subject = "Your SemesterSync password was changed";
  const text = [
    `Hi ${name},`,
    "",
    "The password for your SemesterSync account was just changed, and other devices were logged out.",
    `If this was not you, reset your password right away: ${resetUrl}`,
  ].join("\n");

  const html = layout([
    `Hi ${escapeHtml(name)},`,
    "The password for your SemesterSync account was just changed, and other devices were logged out.",
    `If this was not you, <a href="${escapeHtml(resetUrl)}">reset your password</a> right away.`,
  ]);

  return { subject, text, html };
}
