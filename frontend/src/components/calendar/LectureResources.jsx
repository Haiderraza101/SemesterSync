import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../hooks/useToast.js";
import { lectureService } from "../../services/lectureService.js";
import { formatShortDate, formatTime, parseDateKey } from "../../utils/date.js";
import { getErrorMessage } from "../../utils/errors.js";
import { formatFileSize } from "../../utils/files.js";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Icon from "../ui/Icon.jsx";
import Tabs from "../ui/Tabs.jsx";

const SAVE_DELAY_MS = 800;
const MAX_FILE_MB = 25;
const ACCEPTED_FILES =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.rtf,.odt,.odp,.ods,.png,.jpg,.jpeg,.gif,.webp,.zip,.ipynb,.py,.java,.c,.cpp,.h,.js,.jsx,.ts,.tsx,.html,.css,.sql,.json";

function linkHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function FileRow({ file, onDownload, onDelete }) {
  return (
    <li className="lecture-file">
      <span className="lecture-file__icon" aria-hidden="true">
        <Icon name="timetable" size={16} />
      </span>
      <span className="lecture-file__text">
        <span className="lecture-file__name">{file.name}</span>
        <span className="lecture-file__meta">
          {formatFileSize(file.size)} · {formatShortDate(new Date(file.uploadedAt))}
        </span>
      </span>
      <button type="button" className="lecture-icon-button" aria-label={`Download ${file.name}`} onClick={() => onDownload(file)}>
        <Icon name="export" size={16} />
      </button>
      {onDelete && (
        <button type="button" className="lecture-icon-button lecture-icon-button--danger" aria-label={`Delete ${file.name}`} onClick={() => onDelete(file)}>
          <Icon name="trash" size={16} />
        </button>
      )}
    </li>
  );
}

function LinkRow({ link, onRemove }) {
  return (
    <li className="lecture-link">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="lecture-link__anchor">
        <span className="lecture-link__title">{link.title}</span>
        <span className="lecture-link__host">{linkHost(link.url)}</span>
      </a>
      {onRemove && (
        <button type="button" className="lecture-icon-button lecture-icon-button--danger" aria-label={`Remove ${link.title}`} onClick={() => onRemove(link)}>
          <Icon name="close" size={16} />
        </button>
      )}
    </li>
  );
}

function SaveStatus({ status }) {
  const labels = { saving: "Saving…", saved: "Saved", error: "Not saved" };
  if (!labels[status]) return null;
  return <span className={`lecture-save lecture-save--${status}`}>{labels[status]}</span>;
}

function CurrentLecture({ lectureId, info, lecture, setLecture }) {
  const { notify } = useToast();
  const [notes, setNotes] = useState(lecture.notes);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [uploads, setUploads] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const fileInputRef = useRef(null);
  const savedNotes = useRef(lecture.notes);

  useEffect(() => {
    if (notes === savedNotes.current) return undefined;
    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const updated = await lectureService.save(lectureId, { ...info, notes });
        savedNotes.current = notes;
        setLecture((current) => ({ ...current, ...updated, notes: current.notes }));
        setSaveStatus("saved");
      } catch (error) {
        setSaveStatus("error");
        notify(getErrorMessage(error, "Your notes could not be saved."), "danger");
      }
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [notes, lectureId, info, setLecture, notify]);

  const saveLinks = async (links) => {
    const updated = await lectureService.save(lectureId, { ...info, links });
    setLecture((current) => ({ ...current, links: updated.links, updatedAt: updated.updatedAt }));
  };

  const addLink = async (event) => {
    event.preventDefault();
    setLinkError("");
    const url = /^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    if (!linkTitle.trim() || !linkUrl.trim()) {
      setLinkError("Add a title and a link.");
      return;
    }
    try {
      new URL(url);
    } catch {
      setLinkError("Enter a valid link.");
      return;
    }
    try {
      await saveLinks([...lecture.links, { id: `link-${Date.now()}`, title: linkTitle.trim(), url }]);
      setLinkTitle("");
      setLinkUrl("");
    } catch (error) {
      setLinkError(getErrorMessage(error));
    }
  };

  const removeLink = async (link) => {
    try {
      await saveLinks(lecture.links.filter((item) => item.id !== link.id));
    } catch (error) {
      notify(getErrorMessage(error), "danger");
    }
  };

  const uploadFiles = async (fileList) => {
    const files = [...fileList];
    for (const file of files) {
      const key = `${file.name}-${file.size}-${Date.now()}`;
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        notify(`${file.name} is larger than ${MAX_FILE_MB} MB.`, "danger");
        continue;
      }
      setUploads((current) => [...current, { key, name: file.name, progress: 0 }]);
      try {
        const updated = await lectureService.uploadFile(lectureId, info, file, (progress) =>
          setUploads((current) => current.map((item) => (item.key === key ? { ...item, progress } : item)))
        );
        setLecture((current) => ({ ...current, files: updated.files, updatedAt: updated.updatedAt }));
      } catch (error) {
        notify(getErrorMessage(error, `${file.name} could not be uploaded.`), "danger");
      } finally {
        setUploads((current) => current.filter((item) => item.key !== key));
      }
    }
  };

  const download = async (file) => {
    try {
      await lectureService.downloadFile(lectureId, file);
    } catch (error) {
      notify(getErrorMessage(error, "The file could not be downloaded."), "danger");
    }
  };

  const confirmDelete = async () => {
    const file = pendingDelete;
    setPendingDelete(null);
    try {
      const updated = await lectureService.deleteFile(lectureId, file.id);
      setLecture((current) => ({ ...current, files: updated.files }));
      notify(`${file.name} deleted.`);
    } catch (error) {
      notify(getErrorMessage(error), "danger");
    }
  };

  return (
    <div className="lecture-sections">
      <section className="lecture-section">
        <div className="lecture-section__head">
          <h3 className="lecture-section__title">Lecture notes</h3>
          <SaveStatus status={saveStatus} />
        </div>
        <textarea
          className="lecture-notes"
          value={notes}
          maxLength={20000}
          placeholder="What was covered, homework, things to revise before the exam…"
          aria-label="Lecture notes"
          onChange={(event) => setNotes(event.target.value)}
        />
      </section>

      <section className="lecture-section">
        <div className="lecture-section__head">
          <h3 className="lecture-section__title">Links</h3>
          <span className="lecture-section__count">{lecture.links.length}</span>
        </div>
        {lecture.links.length > 0 && (
          <ul className="lecture-list">
            {lecture.links.map((link) => (
              <LinkRow key={link.id} link={link} onRemove={removeLink} />
            ))}
          </ul>
        )}
        <form className="lecture-link-form" onSubmit={addLink} noValidate>
          <input
            className="input"
            placeholder="Title, e.g. Recording"
            aria-label="Link title"
            value={linkTitle}
            maxLength={120}
            onChange={(event) => setLinkTitle(event.target.value)}
          />
          <input
            className="input"
            placeholder="https://"
            aria-label="Link address"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
          />
          <button type="submit" className="modal-secondary">
            Add
          </button>
        </form>
        {linkError && <p className="field__error">{linkError}</p>}
      </section>

      <section className="lecture-section">
        <div className="lecture-section__head">
          <h3 className="lecture-section__title">Files</h3>
          <span className="lecture-section__count">{lecture.files.length}</span>
        </div>
        {lecture.files.length > 0 && (
          <ul className="lecture-list">
            {lecture.files.map((file) => (
              <FileRow key={file.id} file={file} onDownload={download} onDelete={setPendingDelete} />
            ))}
          </ul>
        )}
        {uploads.map((upload) => (
          <div key={upload.key} className="lecture-upload">
            <span className="lecture-upload__name">{upload.name}</span>
            <span className="lecture-upload__bar">
              <span style={{ width: `${upload.progress}%` }} />
            </span>
          </div>
        ))}
        <button
          type="button"
          className={`lecture-drop${dragging ? " lecture-drop--active" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            uploadFiles(event.dataTransfer.files);
          }}
        >
          <Icon name="upload" size={18} />
          <span>
            Drop slides, PDFs or code here, or <strong>browse</strong>
          </span>
          <span className="lecture-drop__hint">Up to {MAX_FILE_MB} MB each</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept={ACCEPTED_FILES}
          onChange={(event) => {
            uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this file?"
        description={pendingDelete ? `${pendingDelete.name} will be removed from this lecture.` : undefined}
        confirmLabel="Delete file"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function CourseHistory({ lectureId, courseCode, courseName }) {
  const { notify } = useToast();
  const [lectures, setLectures] = useState(null);

  useEffect(() => {
    let active = true;
    lectureService
      .listForCourse(courseCode)
      .then((items) => active && setLectures(items.filter((item) => item.lectureId !== lectureId)))
      .catch((error) => active && notify(getErrorMessage(error), "danger"));
    return () => {
      active = false;
    };
  }, [courseCode, lectureId, notify]);

  if (!lectures) return <p className="lecture-loading">Loading course history…</p>;

  if (lectures.length === 0) {
    return (
      <EmptyState
        variant="compact"
        title="No other lectures saved yet"
        description={`Notes, links and files you add to other ${courseName} lectures will collect here.`}
      />
    );
  }

  const download = (item, file) =>
    lectureService.downloadFile(item.lectureId, file).catch((error) => notify(getErrorMessage(error), "danger"));

  return (
    <ol className="lecture-history">
      {lectures.map((item) => (
        <li key={item.lectureId} className="lecture-history__item">
          <div className="lecture-history__date">
            {formatShortDate(parseDateKey(item.date))}
            {item.start && <span> · {formatTime(item.start)}</span>}
          </div>
          {item.notes && <p className="lecture-history__notes">{item.notes}</p>}
          {item.links.length > 0 && (
            <ul className="lecture-list">
              {item.links.map((link) => (
                <LinkRow key={link.id} link={link} />
              ))}
            </ul>
          )}
          {item.files.length > 0 && (
            <ul className="lecture-list">
              {item.files.map((file) => (
                <FileRow key={file.id} file={file} onDownload={(target) => download(item, target)} />
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function LectureResources({ instance }) {
  const { notify } = useToast();
  const [tab, setTab] = useState("lecture");
  const [lecture, setLecture] = useState(null);
  const lectureId = instance.id;

  const info = useMemo(
    () => ({
      courseCode: instance.course.code,
      courseName: instance.course.name,
      date: instance.dateKey,
      start: instance.start,
    }),
    [instance.course.code, instance.course.name, instance.dateKey, instance.start]
  );

  const load = useCallback(() => {
    let active = true;
    setLecture(null);
    lectureService
      .get(lectureId)
      .then((data) => active && setLecture(data))
      .catch((error) => {
        if (!active) return;
        notify(getErrorMessage(error, "Lecture notes could not be loaded."), "danger");
        setLecture({ lectureId, notes: "", links: [], files: [] });
      });
    return () => {
      active = false;
    };
  }, [lectureId, notify]);

  useEffect(load, [load]);

  return (
    <div className="lecture-resources">
      <Tabs
        label="Lecture resources"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "lecture", label: "This lecture" },
          { value: "history", label: "Course history" },
        ]}
      />
      {tab === "lecture" &&
        (lecture ? (
          <CurrentLecture key={lectureId} lectureId={lectureId} info={info} lecture={lecture} setLecture={setLecture} />
        ) : (
          <p className="lecture-loading">Loading lecture…</p>
        ))}
      {tab === "history" && (
        <CourseHistory lectureId={lectureId} courseCode={instance.course.code} courseName={instance.course.name} />
      )}
    </div>
  );
}
