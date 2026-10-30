import { useState } from "react";
import FileDropzone from "../components/app/FileDropzone.jsx";
import FileSummary from "../components/app/FileSummary.jsx";
import Button from "../components/ui/Button.jsx";
import Notice from "../components/ui/Notice.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { scheduleService } from "../services/scheduleService.js";
import { getErrorMessage } from "../utils/errors.js";
import { formatFileSize, validateSpreadsheet } from "../utils/files.js";

export default function Timetable() {
  const { schedule, setCatalog } = useSchedule();
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState("");
  const catalog = schedule.catalog;

  const handleFile = async (file) => {
    const validationError = validateSpreadsheet(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setUploading(true);
    try {
      setCatalog(await scheduleService.parseTimetable(file));
      setReplacing(false);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "The timetable could not be read."));
    } finally {
      setUploading(false);
    }
  };

  const showUpload = !catalog || replacing;

  return (
    <>
      <PageHeader title="Timetable" description="Upload the university timetable, then select your courses and sections." />
      {error && <Notice variant="danger" title={error} />}
      {showUpload ? (
        <FileDropzone
          label="Drop the timetable Excel file here"
          hint="Excel files (.xlsx, .xls) up to 5 MB"
          busy={uploading}
          busyLabel="Reading timetable…"
          onFile={handleFile}
        />
      ) : (
        <FileSummary
          name={catalog.fileName}
          meta={`${formatFileSize(catalog.fileSize)} · ${catalog.courses.length} courses, ${catalog.totalSections} sections found`}
          action={
            <Button size="sm" onClick={() => setReplacing(true)}>
              Replace file
            </Button>
          }
        />
      )}
    </>
  );
}
