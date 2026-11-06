import { useState } from "react";
import Button from "../ui/Button.jsx";
import Modal from "../ui/Modal.jsx";
import Notice from "../ui/Notice.jsx";
import TextField from "../ui/TextField.jsx";
import { useForm } from "../../hooks/useForm.js";
import { authService } from "../../services/authService.js";
import { getErrorMessage } from "../../utils/errors.js";
import { validatePasswordChange } from "../../utils/validation.js";

const INITIAL_VALUES = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordForm({ onDone, onCancel }) {
  const { values, errors, handleChange, validate } = useForm(INITIAL_VALUES, validatePasswordChange);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      onDone();
    } catch (error) {
      setFormError(getErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <form className="modal__form" onSubmit={handleSubmit} noValidate>
      {formError && <Notice variant="danger" title={formError} />}
      <TextField
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={handleChange}
        error={errors.currentPassword}
      />
      <TextField
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={values.newPassword}
        onChange={handleChange}
        error={errors.newPassword}
        hint="Use 8 or more characters with a number."
      />
      <TextField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />
      <div className="modal__form-actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}

export default function ChangePasswordModal({ open, onDone, onClose }) {
  return (
    <Modal open={open} title="Change password" onClose={onClose}>
      {open && <PasswordForm onDone={onDone} onCancel={onClose} />}
    </Modal>
  );
}
