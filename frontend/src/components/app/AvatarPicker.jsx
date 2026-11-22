import { useEffect, useId, useRef, useState } from "react";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import Icon from "../ui/Icon.jsx";
import { AVATAR_TYPES, validateAvatar } from "../../utils/avatar.js";

export default function AvatarPicker({ name, avatar, file, busy = false, onChange, onRemove, error: externalError }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const hasImage = Boolean(preview || avatar);

  const handleFile = (event) => {
    const chosen = event.target.files?.[0];
    event.target.value = "";
    if (!chosen) return;
    const problem = validateAvatar(chosen);
    setError(problem);
    if (!problem) onChange(chosen);
  };

  const message = error || externalError;

  return (
    <div className="avatar-picker">
      <button
        type="button"
        className="avatar-picker__preview"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={hasImage ? "Change profile picture" : "Add a profile picture"}
      >
        <Avatar name={name} avatar={avatar} src={preview} size={64} />
        <span className="avatar-picker__badge" aria-hidden="true">
          <Icon name="camera" size={13} strokeWidth={2} />
        </span>
      </button>
      <div className="avatar-picker__text">
        <span className="avatar-picker__title">Profile picture</span>
        <span className={message ? "avatar-picker__error" : "avatar-picker__hint"}>
          {message || "PNG, JPG or WebP, up to 2 MB. Optional."}
        </span>
        <div className="avatar-picker__actions">
          <label htmlFor={inputId} className="btn btn--secondary btn--sm avatar-picker__upload">
            {busy ? "Uploading…" : hasImage ? "Change" : "Upload photo"}
          </label>
          {hasImage && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setError("");
                if (file) onChange(null);
                else onRemove?.();
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept={AVATAR_TYPES.join(",")}
        disabled={busy}
        onChange={handleFile}
      />
    </div>
  );
}
