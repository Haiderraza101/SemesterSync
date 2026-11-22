import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthField from "../components/app/AuthField.jsx";
import Icon from "../components/ui/Icon.jsx";
import Notice from "../components/ui/Notice.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useForm } from "../hooks/useForm.js";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { cx } from "../utils/cx.js";
import { getErrorMessage, getFieldErrors } from "../utils/errors.js";
import { validateRegister } from "../utils/validation.js";
import "../styles/pages/auth.css";

const INITIAL_VALUES = {
  name: "",
  rollNumber: "",
  section: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const PASSWORD_CHECKS = [
  { label: "8 or more characters", test: (value) => value.length >= 8 },
  { label: "A letter", test: (value) => /[A-Za-z]/.test(value) },
  { label: "A number", test: (value) => /\d/.test(value) },
];

function PasswordChecks({ password }) {
  if (!password) return null;
  return (
    <ul className="password-checks">
      {PASSWORD_CHECKS.map((check) => {
        const passed = check.test(password);
        return (
          <li key={check.label} className={cx("password-checks__item", passed && "password-checks__item--ok")}>
            <Icon name={passed ? "check" : "close"} size={12} strokeWidth={2.5} />
            {check.label}
          </li>
        );
      })}
    </ul>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { values, errors, setErrors, handleChange, validate } = useForm(INITIAL_VALUES, validateRegister);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        rollNumber: values.rollNumber.trim().toUpperCase(),
        section: values.section.trim().toUpperCase(),
        email: values.email.trim(),
        password: values.password,
        remember: true,
      });
      navigate("/app/timetable", { replace: true });
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your SemesterSync account"
      subtitle="Set up your semester in a few minutes: upload your timetable and pick your sections."
      switchText="Already have an account?"
      switchLink={{ to: "/login", label: "Log in" }}
      footer="Your roll number and section are used to suggest your courses."
      wide
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <Notice variant="danger" title={formError} />}

        <AuthField
          label="Full name"
          name="name"
          icon="user"
          autoComplete="name"
          placeholder="Your full name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          autoFocus
        />
        <div className="auth-form__row">
          <AuthField
            label="Roll number"
            name="rollNumber"
            icon="hash"
            placeholder="23L-1234"
            value={values.rollNumber}
            onChange={handleChange}
            error={errors.rollNumber}
          />
          <AuthField
            label="Section"
            name="section"
            icon="users"
            placeholder="BCS-7A"
            value={values.section}
            onChange={handleChange}
            error={errors.section}
          />
        </div>
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
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          icon="lock"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        >
          <PasswordChecks password={values.password} />
        </AuthField>
        <AuthField
          label="Confirm password"
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
          {submitting ? "Creating account…" : "Create account"}
          {!submitting && <Icon name="arrow-right" size={16} strokeWidth={2} />}
        </button>
      </form>
    </AuthLayout>
  );
}
