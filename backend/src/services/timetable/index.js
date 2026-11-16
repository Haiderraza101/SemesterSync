import AppError from "../../utils/AppError.js";
import { buildCatalog } from "./catalogBuilder.js";
import { createCodeMatcher, readCourseCodes } from "./courseCodes.js";
import { courseListFormat } from "./formats/courseListFormat.js";
import { roomGridFormat } from "./formats/roomGridFormat.js";
import { readWorkbook } from "./sheetGrid.js";
import { detectSemesterName } from "./workbookMeta.js";

const FORMATS = [courseListFormat, roomGridFormat];
const PRIORITY_WEIGHT = 0.1;

function score({ format, result }) {
  return result.entries.length * (1 + format.priority * PRIORITY_WEIGHT);
}

function loadWorkbook(buffer) {
  try {
    return readWorkbook(buffer);
  } catch {
    throw new AppError("This file could not be read. Upload the timetable as an .xlsx or .xls file.", 422, {
      code: "UNREADABLE_FILE",
    });
  }
}

function detectFormat(workbook) {
  return FORMATS.map((format) => ({ format, result: format.parse(workbook) }))
    .filter(({ result }) => result && result.entries.length > 0)
    .sort((a, b) => score(b) - score(a))[0];
}

export function parseTimetable(buffer, { fileName, fileSize }) {
  const workbook = loadWorkbook(buffer);
  const detected = detectFormat(workbook);

  if (!detected) {
    throw new AppError(
      "No classes were found in this file. Make sure it is the university timetable with rooms, days and time slots.",
      422,
      { code: "UNRECOGNIZED_TIMETABLE" }
    );
  }

  const catalog = buildCatalog(detected.result.entries, {
    matchCode: createCodeMatcher(readCourseCodes(workbook)),
    fileName,
    fileSize,
    format: detected.format.id,
    sheetName: detected.result.sheetName,
  });
  return { ...catalog, semesterName: detectSemesterName(workbook) };
}
