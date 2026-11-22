import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthField from "../components/app/AuthField.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import Icon from "../components/ui/Icon.jsx";
import Notice from "../components/ui/Notice.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useForm } from "../hooks/useForm.js";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { getErrorMessage } from "../utils/errors.js";
import { validateLogin } from "../utils/validation.js";
import "../styles/pages/auth.css";

const INITIAL_VALUES = { email: "", password: "", remember: true };

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
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to SemesterSync"
      subtitle="Pick up where you left off: your classes, exams and deadlines."
      switchText="New to SemesterSync?"
      switchLink={{ to: "/register", label: "Create account" }}
      footer="Your schedule and attendance stay private to your account."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {notice && !formError && <Notice variant="success" title={notice} />}
        {formError && <Notice variant="danger" title={formError} />}

        <AuthField
          label="Email"
          name="email"
          type="email"
          icon="mail"
          autoComplete="email"
          placeholder="you@university.edu.pk"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          autoFocus
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          icon="lock"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Checkbox label="Keep me logged in" name="remember" checked={values.remember} onChange={handleChange} />

        <button type="submit" className="btn btn--primary btn--lg btn--block auth-submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
          {!submitting && <Icon name="arrow-right" size={16} strokeWidth={2} />}
        </button>
      </form>
    </AuthLayout>
  );
}
