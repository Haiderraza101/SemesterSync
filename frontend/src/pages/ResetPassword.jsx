import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Logo from "../components/ui/Logo.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageLoader from "../components/ui/PageLoader.jsx";
import TextField from "../components/ui/TextField.jsx";
import { useForm } from "../hooks/useForm.js";
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
    <>
      <div className="auth-form__header">
        <h1>Link expired</h1>
        <p className="auth-card__text">
          This reset link is invalid, has already been used or has expired. Request a new one to continue.
        </p>
      </div>
      <Button to="/forgot-password" variant="primary" size="lg" block>
        Request a new link
      </Button>
    </>
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
      <div className="auth-form__header">
        <h1>Choose a new password</h1>
        <p className="auth-card__text">You will be logged out of every device once your password is reset.</p>
      </div>
      {formError && <Notice variant="danger" title={formError} />}
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
        hint="Use 8 or more characters with a letter and a number."
      />
      <TextField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter password"
        value={values.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />
      <Button type="submit" variant="primary" size="lg" block disabled={submitting}>
        {submitting ? "Resetting…" : "Reset password"}
      </Button>
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

  return (
    <div className="auth-card-page">
      <Logo />
      <div className="auth-card">
        {status === "invalid" ? (
          <InvalidLink />
        ) : (
          <ResetForm token={token} onInvalid={() => setStatus("invalid")} />
        )}
        <div className="auth-form__footer">
          <Link to="/login">Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
