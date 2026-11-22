import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthField from "../components/app/AuthField.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageLoader from "../components/ui/PageLoader.jsx";
import { useForm } from "../hooks/useForm.js";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { authService } from "../services/authService.js";
import { getErrorCode, getErrorMessage, getFieldErrors } from "../utils/errors.js";
import { validateResetPassword } from "../utils/validation.js";
import "../styles/pages/auth.css";

const INITIAL_VALUES = { password: "", confirmPassword: "" };
const INVALID_TOKEN_CODE = "RESET_TOKEN_INVALID";

function isInvalidTokenError(error) {
  return getErrorCode(error) === INVALID_TOKEN_CODE || error?.response?.status === 400;
}

function InvalidLink() {
  return (
    <div className="auth-form">
      <div className="auth-status auth-status--danger">
        <span className="auth-status__icon" aria-hidden="true">
          <Icon name="alert" size={20} strokeWidth={2} />
        </span>
        <div>
          <p className="auth-status__title">This link cannot be used</p>
          <p className="auth-status__text">It is invalid, has already been used or has expired.</p>
        </div>
      </div>
      <Button to="/forgot-password" variant="primary" size="lg" block>
        Request a new link
      </Button>
    </div>
  );
}

function ResetForm({ token, onInvalid }) {
  const navigate = useNavigate();
  const { values, errors, setErrors, handleChange, validate } = useForm(INITIAL_VALUES, validateResetPassword);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { message } = await authService.resetPassword(token, values.password);
      navigate("/login", { replace: true, state: { notice: message } });
    } catch (error) {
      if (getErrorCode(error) === INVALID_TOKEN_CODE) {
        onInvalid();
        return;
      }
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError && <Notice variant="danger" title={formError} />}
      <AuthField
        label="New password"
        name="password"
        type="password"
        icon="lock"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
        hint="Use 8 or more characters with a letter and a number."
        autoFocus
      />
      <AuthField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        icon="lock"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={values.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />
      <button type="submit" className="btn btn--primary btn--lg btn--block auth-submit" disabled={submitting}>
        {submitting ? "Resetting…" : "Reset password"}
        {!submitting && <Icon name="arrow-right" size={16} strokeWidth={2} />}
      </button>
    </form>
  );
}

export default function ResetPassword() {
  const { token } = useParams();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;
    authService
      .verifyResetToken(token)
      .then(() => active && setStatus("ready"))
      .catch((error) => active && setStatus(isInvalidTokenError(error) ? "invalid" : "ready"));
    return () => {
      active = false;
    };
  }, [token]);

  if (status === "checking") return <PageLoader />;

  const invalid = status === "invalid";

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title={invalid ? "Link expired" : "Choose a new password"}
      subtitle={invalid ? "Request a new reset link to continue." : "You will be logged out of every device once your password is reset."}
      switchText="Remembered it?"
      switchLink={{ to: "/login", label: "Log in" }}
    >
      {invalid ? <InvalidLink /> : <ResetForm token={token} onInvalid={() => setStatus("invalid")} />}
    </AuthLayout>
  );
}
