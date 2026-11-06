import nodemailer from "nodemailer";
import { env, isProduction } from "../config/env.js";

let transporter = null;

function isConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  if (!isConfigured()) {
    if (isProduction) throw new Error("Email delivery is not configured.");
    console.info(`Email to ${to}: ${subject}\n${text}`);
    return;
  }

  await getTransporter().sendMail({ from: env.smtp.from, to, subject, text, html });
}
