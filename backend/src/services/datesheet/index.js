import * as XLSX from "xlsx";
import AppError from "../../utils/AppError.js";
import { collapseSpaces } from "../timetable/courseText.js";
import { createSheetGrid, readWorkbook } from "../timetable/sheetGrid.js";
import { extractTimeRange, formatMinutes, isTimeOnly } from "../timetable/timeText.js";
import { detectSemesterName, titleLines } from "../timetable/workbookMeta.js";

const HEADER_SCAN_ROWS = 25;
const CODE_HEADER_PATTERN = /^(course\s*)?code$/i;
const DATE_HEADER_PATTERN = /^date$/i;
const COURSE_CODE_PATTERN = /^[A-Z]{2,3}\s?-?\d{3,4}[A-Z]?$/;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MIN_EXCEL_SERIAL = 20000;
const MAX_EXCEL_SERIAL = 80000;

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(year, month, day) {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(fullYear, month - 1, day);
  if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${fullYear}-${pad(month)}-${pad(day)}`;
}

export function parseExamDate(text) {
  const value = collapseSpaces(String(text)).replace(/^[A-Za-z]+day,?\s*/i, "");
  if (!value) return null;

  if (/^\d+(\.\d+)?$/.test(value)) {
    const serial = Number(value);
    if (serial < MIN_EXCEL_SERIAL || serial > MAX_EXCEL_SERIAL) return null;
    const parsed = XLSX.SSF.parse_date_code(serial);
    return parsed ? toDateKey(parsed.y, parsed.m, parsed.d) : null;
  }

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value);
  if (iso) return toDateKey(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const named = /^(\d{1,2})[\s\-/.]*([A-Za-z]{3,9})[\s\-/.,]*(\d{2,4})$/.exec(value);
  if (named) {
    const month = MONTHS.indexOf(named[2].slice(0, 3).toLowerCase()) + 1;
    return month ? toDateKey(Number(named[3]), month, Number(named[1])) : null;
  }

  const monthFirst = /^([A-Za-z]{3,9})[\s\-/.]*(\d{1,2}),?[\s\-/.]*(\d{2,4})$/.exec(value);
  if (monthFirst) {
    const month = MONTHS.indexOf(monthFirst[1].slice(0, 3).toLowerCase()) + 1;
    return month ? toDateKey(Number(monthFirst[3]), month, Number(monthFirst[2])) : null;
  }

  const numeric = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(value);
  if (numeric) return toDateKey(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]));

  return null;
}

function readHeader(grid, row) {
  const cells = grid.rowCells(row);
  const dateCell = cells.find((cell) => DATE_HEADER_PATTERN.test(collapseSpaces(cell.text)));
  if (!dateCell) return null;

  const slots = cells.flatMap((cell, index) => {
    if (!CODE_HEADER_PATTERN.test(collapseSpaces(cell.text))) return [];
    const next = cells[index + 1];
    if (!next || !isTimeOnly(next.text)) return [];
    return [{ codeCol: cell.c0, nameCol: next.c0, range: extractTimeRange(next.text).range }];
  });

  return slots.length > 0 ? { dateCol: dateCell.c0, slots } : null;
}

function findHeader(grid) {
  const lastRow = Math.min(grid.lastRow, grid.firstRow + HEADER_SCAN_ROWS);
  for (let row = grid.firstRow; row <= lastRow; row += 1) {
    const header = readHeader(grid, row);
    if (header) return { row, ...header };
  }
  return null;
}

function parseSheet(sheet) {
  const grid = createSheetGrid(sheet);
  if (!grid) return [];

  const first = findHeader(grid);
  if (!first) return [];

  const exams = [];
  let header = first;
  let date = null;

  for (let row = first.row + 1; row <= grid.lastRow; row += 1) {
    const repeated = readHeader(grid, row);
    if (repeated) {
      header = repeated;
      continue;
    }

    const dateText = grid.text(row, header.dateCol);
    if (dateText) date = parseExamDate(dateText);
    if (!date) continue;

    header.slots.forEach((slot) => {
      const code = grid.text(row, slot.codeCol).toUpperCase().replace(/[\s-]/g, "");
      if (!COURSE_CODE_PATTERN.test(code)) return;
      exams.push({
        code,
        name: collapseSpaces(grid.text(row, slot.nameCol)),
        date,
        start: formatMinutes(slot.range.start),
        end: formatMinutes(slot.range.end),
        venue: "",
      });
    });
  }

  return exams;
}

export function detectExamTerm(workbook) {
  const title = titleLines(workbook).join(" ").toLowerCase();
  if (/\bfinal/.test(title)) return "final";
  if (/mid\s*-?\s*term\s*[-–]?\s*(ii|2)\b|\bmid\s*[-–]?\s*(ii|2)\b|\bmid2\b/.test(title)) return "midterm2";
  if (/\bmid/.test(title)) return "midterm";
  return null;
}

function uniqueByCode(exams) {
  const seen = new Map();
  exams.forEach((exam) => {
    if (!seen.has(exam.code)) seen.set(exam.code, exam);
  });
  return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
}

export function parseDateSheet(buffer, { fileName, fileSize }) {
  let workbook;
  try {
    workbook = readWorkbook(buffer);
  } catch {
    throw new AppError("This file could not be read. Upload the date sheet as an .xlsx or .xls file.", 422, {
      code: "UNREADABLE_FILE",
    });
  }

  const exams = uniqueByCode(workbook.SheetNames.flatMap((sheetName) => parseSheet(workbook.Sheets[sheetName])));
  if (exams.length === 0) {
    throw new AppError(
      "No exams were found in this file. Make sure it is the date sheet with Date, Code and time slot columns.",
      422,
      { code: "UNRECOGNIZED_DATE_SHEET" }
    );
  }

  return {
    fileName,
    fileSize,
    uploadedAt: new Date().toISOString(),
    semesterName: detectSemesterName(workbook),
    detectedTerm: detectExamTerm(workbook),
    totalPapers: exams.length,
    exams,
  };
}
