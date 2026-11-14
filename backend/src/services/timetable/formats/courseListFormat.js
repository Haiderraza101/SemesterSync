import { cleanInstructor, collapseSpaces, isIgnoredText, isLabName } from "../courseText.js";
import { expandSections } from "../sectionText.js";
import { createSheetGrid } from "../sheetGrid.js";
import { dayFromText, extractTimeRange, parseClockTime } from "../timeText.js";

const HEADER_SCAN_ROWS = 15;
const PLACEHOLDER_CODE_PATTERN = /X{2,}/i;
const LAB_CODE_PATTERN = /^[A-Z]L\d/;
const DEFAULT_VENUE = "TBA";
const BATCH_HEADING_PATTERN = /^(BS|MS|PhD)\s*\(?\s*[A-Z]{2,4}\s*\)?/i;
const HEADCOUNT_PATTERN = /\(\d+\)/g;
const ELECTIVE_PATTERN = /elective|supporting/i;
const REPEAT_PATTERN = /repeat/i;

const COLUMN_MATCHERS = {
  code: /^(course\s*)?code$/i,
  title: /^(course\s*)?(title|name)$/i,
  section: /^sections?$/i,
  instructor: /^(instructor|teacher|faculty)(\s*name)?$/i,
  shortTitle: /^(course\s*)?short\s*(title|name)$/i,
  duration: /^duration(\s*in\s*minutes)?$/i,
  category: /^category$/i,
};

const SLOT_MATCHERS = {
  day: /^day\s*(\d*)$/i,
  slot: /^(slot|time|start(\s*time)?)\s*(\d*)$/i,
  venue: /^(venue|room)\s*(\d*)$/i,
};

function readColumns(grid, row) {
  const columns = {};
  const slots = new Map();

  grid.rowCells(row).forEach((cell) => {
    const label = collapseSpaces(cell.text);
    Object.entries(COLUMN_MATCHERS).forEach(([key, pattern]) => {
      if (columns[key] === undefined && pattern.test(label)) columns[key] = cell.c0;
    });
    Object.entries(SLOT_MATCHERS).forEach(([key, pattern]) => {
      const match = pattern.exec(label);
      if (!match) return;
      const index = match[match.length - 1] || "1";
      if (!slots.has(index)) slots.set(index, {});
      if (slots.get(index)[key] === undefined) slots.get(index)[key] = cell.c0;
    });
  });

  const slotColumns = [...slots.values()].filter((slot) => slot.day !== undefined && slot.slot !== undefined);
  const valid = columns.title !== undefined && columns.section !== undefined && slotColumns.length > 0;
  return valid ? { ...columns, slots: slotColumns } : null;
}

function findHeader(grid) {
  const lastRow = Math.min(grid.lastRow, grid.firstRow + HEADER_SCAN_ROWS);
  for (let row = grid.firstRow; row <= lastRow; row += 1) {
    const columns = readColumns(grid, row);
    if (columns) return { row, columns };
  }
  return null;
}

function readRange(slotText, durationText) {
  const explicit = extractTimeRange(slotText).range;
  if (explicit) return explicit;

  const start = parseClockTime(slotText);
  const duration = Number.parseInt(durationText, 10);
  if (start === null || !Number.isFinite(duration) || duration <= 0) return null;
  return { start, end: start + duration };
}

function cleanCode(text) {
  const code = collapseSpaces(text).toUpperCase().replace(/\s+/g, "");
  return code && !PLACEHOLDER_CODE_PATTERN.test(code) && /\d/.test(code) ? code : "";
}

function readHeading(grid, row, columns) {
  const read = (key) => (columns[key] === undefined ? "" : grid.text(row, columns[key]));
  if (read("section")) return null;
  const text = collapseSpaces(read("code") || read("title"));
  if (!text || (read("code") && read("title"))) return null;
  return text.replace(HEADCOUNT_PATTERN, "").replace(/[:\s]+$/, "").trim();
}

function applyHeading(state, heading) {
  if (BATCH_HEADING_PATTERN.test(heading)) return { batch: heading, group: "core" };
  if (REPEAT_PATTERN.test(heading)) return { ...state, group: "repeat" };
  if (ELECTIVE_PATTERN.test(heading)) return { ...state, group: "elective" };
  if (/^labs?$/i.test(heading)) return { ...state, group: state.group === "repeat" ? "repeat" : "core" };
  return state;
}

function courseType(group, category) {
  if (group === "repeat") return "repeat";
  if (group === "elective" || ELECTIVE_PATTERN.test(category)) return "elective";
  return "core";
}

function parseRow(grid, row, columns, state) {
  const read = (key) => (columns[key] === undefined ? "" : grid.text(row, columns[key]));
  const title = collapseSpaces(read("title"));
  const sectionText = read("section");
  if (!title || !sectionText || isIgnoredText(title)) return [];

  const type = courseType(state.group, read("category"));

  const code = cleanCode(read("code"));
  const sections = expandSections(sectionText);
  const instructor = read("instructor") ? cleanInstructor(read("instructor").replace(/\(?\bVF\b\)?/g, "")) : "";
  const kind = isLabName(title) || LAB_CODE_PATTERN.test(code) ? "lab" : "class";

  return columns.slots.flatMap((slotColumns) => {
    const day = dayFromText(grid.text(row, slotColumns.day));
    const range = readRange(grid.text(row, slotColumns.slot), read("duration"));
    if (day === null || !range) return [];

    const room = slotColumns.venue === undefined ? "" : collapseSpaces(grid.text(row, slotColumns.venue));
    return sections.map((section) => ({
      code,
      name: title,
      shortName: collapseSpaces(read("shortTitle")),
      section,
      instructor,
      room: room || DEFAULT_VENUE,
      day,
      start: range.start,
      end: range.end,
      kind,
      type,
      batch: state.batch,
    }));
  });
}

function parseSheet(sheet) {
  const grid = createSheetGrid(sheet);
  if (!grid) return [];

  const header = findHeader(grid);
  if (!header) return [];

  const entries = [];
  let state = { batch: "", group: "core" };
  for (let row = header.row + 1; row <= grid.lastRow; row += 1) {
    const heading = readHeading(grid, row, header.columns);
    if (heading) {
      state = applyHeading(state, heading);
      continue;
    }
    entries.push(...parseRow(grid, row, header.columns, state));
  }
  return entries;
}

export const courseListFormat = {
  id: "course-list",
  label: "Course list with day, slot and venue columns",
  priority: 2,

  parse(workbook) {
    const sheets = workbook.SheetNames.map((sheetName) => ({
      sheetName,
      entries: parseSheet(workbook.Sheets[sheetName]),
    })).filter((result) => result.entries.length > 0);

    if (sheets.length === 0) return null;
    return {
      sheetName: sheets.map((sheet) => sheet.sheetName).join(", "),
      entries: sheets.flatMap((sheet) => sheet.entries),
    };
  },
};
