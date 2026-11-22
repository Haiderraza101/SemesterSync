import { useState } from "react";
import AvatarPicker from "../app/AvatarPicker.jsx";
import Button from "../ui/Button.jsx";
import Panel from "../ui/Panel.jsx";
import TextField from "../ui/TextField.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useForm } from "../../hooks/useForm.js";
import { useToast } from "../../hooks/useToast.js";
import { getErrorMessage } from "../../utils/errors.js";
import { validateProfile } from "../../utils/validation.js";

export default function ProfileForm() {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuth();
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const changeAvatar = async (action, message) => {
    setAvatarBusy(true);
    try {
      await action();
      notify(message);
    } catch (error) {
      notify(getErrorMessage(error), "danger");
    } finally {
      setAvatarBusy(false);
    }
  };
  const { values, errors, handleChange, validate } = useForm(
    { name: user.name, email: user.email, rollNumber: user.rollNumber, section: user.section },
    validateProfile
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfile({
        name: values.name.trim(),
        email: values.email.trim(),
        rollNumber: values.rollNumber.trim().toUpperCase(),
        section: values.section.trim().toUpperCase(),
      });
      notify("Profile updated.");
    } catch (error) {
      notify(getErrorMessage(error), "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Panel
        footer={
          <>
            <span />
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        <AvatarPicker
          name={values.name}
          avatar={user.avatar}
          busy={avatarBusy}
          onChange={(file) => file && changeAvatar(() => uploadAvatar(file), "Profile picture updated.")}
          onRemove={() => changeAvatar(removeAvatar, "Profile picture removed.")}
        />
        <div className="profile-form">
          <TextField
            label="Full name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <TextField
            label="Roll number"
            name="rollNumber"
            value={values.rollNumber}
            onChange={handleChange}
            error={errors.rollNumber}
          />
          <TextField
            label="Section"
            name="section"
            value={values.section}
            onChange={handleChange}
            error={errors.section}
          />
        </div>
      </Panel>
    </form>
  );
}
