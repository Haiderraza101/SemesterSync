import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import ModalSubmitButton from "../ui/ModalSubmitButton.jsx";
import Notice from "../ui/Notice.jsx";
import TextField from "../ui/TextField.jsx";
import { useForm } from "../../hooks/useForm.js";
import { authService } from "../../services/authService.js";
import { getErrorMessage, getFieldErrors } from "../../utils/errors.js";
import { validatePasswordChange } from "../../utils/validation.js";

const INITIAL_VALUES = { currentPassword: "", newPassword: "", confirmPassword: "" };

const FORM_ID = "change-password-form";

function PasswordForm({ onDone, saving, setSaving }) {
  const { values, errors, setErrors, handleChange, validate } = useForm(INITIAL_VALUES, validatePasswordChange);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (saving || !validate()) return;
    setSaving(true);
    try {
      const { message } = await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      onDone(message);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <form id={FORM_ID} className="modal__form form-stack" onSubmit={handleSubmit} noValidate>
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
        hint="Use 8 or more characters with a letter and a number."
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
    </form>
  );
}

export default function ChangePasswordModal({ open, onDone, onClose }) {
  const [saving, setSaving] = useState(false);

  const handleDone = (message) => {
    setSaving(false);
    onDone(message);
  };

  return (
    <Modal
      open={open}
      parent="Settings"
      title="Change password"
      onClose={onClose}
      footer={<ModalSubmitButton label="Update password" busyLabel="Updating..." busy={saving} formId={FORM_ID} />}
    >
      {open && <PasswordForm onDone={handleDone} saving={saving} setSaving={setSaving} />}
    </Modal>
  );
}
