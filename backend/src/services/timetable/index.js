import AppError from "../../utils/AppError.js";
import { buildCatalog } from "./catalogBuilder.js";
import { createCodeMatcher, readCourseCodes } from "./courseCodes.js";
import { courseListFormat } from "./formats/courseListFormat.js";
import { roomGridFormat } from "./formats/roomGridFormat.js";
import { createSheetGrid, readWorkbook } from "./sheetGrid.js";

const FORMATS = [courseListFormat, roomGridFormat];
const PRIORITY_WEIGHT = 0.1;
const SEMESTER_PATTERN = /\b(fall|spring|summer)\s*[-–]?\s*(20\d{2})\b/i;
const TITLE_SCAN_ROWS = 6;

function detectSemesterName(workbook) {
  for (const sheetName of workbook.SheetNames) {
    const grid = createSheetGrid(workbook.Sheets[sheetName]);
    if (!grid) continue;
    const lastRow = Math.min(grid.lastRow, grid.firstRow + TITLE_SCAN_ROWS);
    for (let row = grid.firstRow; row <= lastRow; row += 1) {
      const match = grid.rowCells(row).map((cell) => SEMESTER_PATTERN.exec(cell.text)).find(Boolean);
      if (match) return `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()} ${match[2]}`;
    }
  }
  return "";
}

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
