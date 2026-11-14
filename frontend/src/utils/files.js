export const SPREADSHEET_EXTENSIONS = [".xlsx", ".xls"];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateSpreadsheet(file) {
  if (!file) return "Choose a file to upload.";
  const name = file.name.toLowerCase();
  if (!SPREADSHEET_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "Upload an Excel file (.xlsx or .xls).";
  }
  if (file.size > MAX_UPLOAD_BYTES) return "The file is larger than 10 MB.";
  return "";
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
