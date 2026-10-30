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
      <Icon name="upload" size={22} className="dropzone__icon" />
      {busy ? (
        <p className="dropzone__title" role="status">
          {busyLabel}
        </p>
      ) : (
        <>
          <p className="dropzone__title">
            {label}, or{" "}
            <label htmlFor={inputId} className="dropzone__browse">
              browse
            </label>
          </p>
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
