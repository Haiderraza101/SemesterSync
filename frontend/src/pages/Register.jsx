import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../layouts/AuthSplitLayout.jsx";
import Button from "../components/ui/Button.jsx";
import Notice from "../components/ui/Notice.jsx";
import TextField from "../components/ui/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useForm } from "../hooks/useForm.js";
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

const STEPS = [
  "Upload the timetable Excel file from your university",
  "Select your courses and sections",
  "Get reminders and a daily morning summary",
];

function RegisterAside() {
  return (
    <>
      <h2 className="auth-split__headline">Set up your semester in a few minutes.</h2>
      <ol className="steps-list">
        {STEPS.map((step, index) => (
          <li key={step} className="steps-list__item">
            <span className="steps-list__number">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </>
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
    <AuthSplitLayout aside={<RegisterAside />} footer="Web Programming project · BCS 7A">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form__header">
          <h1>Create an account</h1>
          <p className="auth-form__subtitle">All fields are required.</p>
        </div>

        {formError && <Notice variant="danger" title={formError} />}

        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Your full name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
        />
        <div className="auth-form__row">
          <TextField
            label="Roll number"
            name="rollNumber"
            placeholder="e.g. 23L-1234"
            value={values.rollNumber}
            onChange={handleChange}
            error={errors.rollNumber}
          />
          <TextField
            label="Section"
            name="section"
            placeholder="e.g. BCS-7A"
            value={values.section}
            onChange={handleChange}
            error={errors.section}
          />
        </div>
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          hint="Use 8 or more characters with a letter and a number."
        />
        <TextField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <Button type="submit" variant="primary" size="lg" block disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="auth-form__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
