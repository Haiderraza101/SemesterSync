import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../layouts/AuthSplitLayout.jsx";
import Button from "../components/ui/Button.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import Notice from "../components/ui/Notice.jsx";
import TextField from "../components/ui/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useForm } from "../hooks/useForm.js";
import { getErrorMessage } from "../utils/errors.js";
import { validateLogin } from "../utils/validation.js";
import "../styles/pages/auth.css";

const INITIAL_VALUES = { email: "", password: "", remember: true };

const LOGIN_FEATURES = [
  "Your timetable read straight from the university Excel file",
  "Clash warnings before you commit to a section",
  "Reminders and a morning summary by email",
];

function LoginAside() {
  return (
    <>
      <h2 className="auth-split__headline">Classes, exams and deadlines in one calendar.</h2>
      <p className="auth-split__lead">Your schedule, attendance and reminders, kept in sync for the whole semester.</p>
      <ul className="steps-list">
        {LOGIN_FEATURES.map((feature) => (
          <li key={feature} className="steps-list__item">
            <span className="steps-list__number" aria-hidden="true">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { values, errors, handleChange, validate } = useForm(INITIAL_VALUES, validateLogin);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const notice = location.state?.notice;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password, remember: values.remember });
      navigate(location.state?.from || "/app", { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout aside={<LoginAside />}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form__header">
          <h1>Log in</h1>
          <p className="auth-form__subtitle">Enter your details to access your schedule.</p>
        </div>

        {notice && !formError && <Notice variant="success" title={notice} />}
        {formError && <Notice variant="danger" title={formError} />}

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu.pk"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          labelAction={<Link to="/forgot-password">Forgot password?</Link>}
        />
        <Checkbox label="Keep me logged in" name="remember" checked={values.remember} onChange={handleChange} />

        <Button type="submit" variant="primary" size="lg" block disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>

        <p className="auth-form__footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
