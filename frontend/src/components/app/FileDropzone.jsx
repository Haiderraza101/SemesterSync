import { useId, useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { cx } from "../../utils/cx.js";
import { SPREADSHEET_EXTENSIONS } from "../../utils/files.js";

export default function FileDropzone({ label, hint, busy = false, busyLabel = "Reading file…", onFile }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!busy) handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      className={cx("dropzone", dragging && "dropzone--active", busy && "dropzone--busy")}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <span className="dropzone__icon" aria-hidden="true">
        <Icon name="upload" size={20} strokeWidth={2} />
      </span>
      {busy ? (
        <p className="dropzone__title" role="status">
          {busyLabel}
        </p>
      ) : (
        <>
          <p className="dropzone__title">{label}</p>
          <p className="dropzone__or">or</p>
          <label htmlFor={inputId} className="btn btn--primary btn--lg dropzone__button">
            <Icon name="upload" size={16} strokeWidth={2} />
            Choose Excel file
          </label>
          {hint && <p className="dropzone__hint">{hint}</p>}
        </>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept={SPREADSHEET_EXTENSIONS.join(",")}
        disabled={busy}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
