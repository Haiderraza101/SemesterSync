import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Logo from "../components/ui/Logo.jsx";
import Notice from "../components/ui/Notice.jsx";
import TextField from "../components/ui/TextField.jsx";
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

  const handleReset = () => {
    setSent(false);
    setEmail("");
  };

  return (
    <div className="auth-card-page">
      <Logo />
      <div className="auth-card">
        {sent ? (
          <>
            <div className="auth-form__header">
              <h1>Check your email</h1>
              <p className="auth-card__text">
                If an account exists for {email.trim()}, a reset link has been sent. The link expires in 30 minutes.
              </p>
            </div>
            <Button size="lg" block onClick={handleReset}>
              Use a different email
            </Button>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-form__header">
              <h1>Reset your password</h1>
              <p className="auth-card__text">
                Enter the email you signed up with. We will send you a link to set a new password.
              </p>
            </div>
            {formError && <Notice variant="danger" title={formError} />}
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu.pk"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              error={error}
            />
            <Button type="submit" variant="primary" size="lg" block disabled={submitting}>
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <div className="auth-form__footer">
          <Link to="/login">Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
