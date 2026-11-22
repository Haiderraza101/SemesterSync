import { useState } from "react";
import AuthField from "../components/app/AuthField.jsx";
import Icon from "../components/ui/Icon.jsx";
import Notice from "../components/ui/Notice.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { authService } from "../services/authService.js";
import { getErrorMessage } from "../utils/errors.js";
import { isValidEmail } from "../utils/validation.js";
import "../styles/pages/auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={
        sent
          ? "If an account exists for that address, a reset link is on its way."
          : "Enter the email you signed up with and we will send you a link to set a new password."
      }
      switchText="Remembered it?"
      switchLink={{ to: "/login", label: "Log in" }}
    >
      {sent ? (
        <div className="auth-form">
          <div className="auth-status">
            <span className="auth-status__icon" aria-hidden="true">
              <Icon name="mail" size={20} strokeWidth={2} />
            </span>
            <div>
              <p className="auth-status__title">Link sent to {email.trim()}</p>
              <p className="auth-status__text">It expires in 30 minutes. Check your spam folder if it does not arrive.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--lg btn--block"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formError && <Notice variant="danger" title={formError} />}
          <AuthField
            label="Email"
            name="email"
            type="email"
            icon="mail"
            autoComplete="email"
            placeholder="you@university.edu.pk"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            error={error}
            autoFocus
          />
          <button type="submit" className="btn btn--primary btn--lg btn--block auth-submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
            {!submitting && <Icon name="arrow-right" size={16} strokeWidth={2} />}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
