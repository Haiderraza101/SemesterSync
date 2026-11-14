import { cleanInstructor, collapseSpaces, isIgnoredText, isLabName, looksLikeInstructor, splitCourseText } from "../courseText.js";
import { expandSections } from "../sectionText.js";
import { createSheetGrid } from "../sheetGrid.js";
import { createColumnClock, dayFromText, extractTimeRange, isTimeOnly } from "../timeText.js";

const HEADER_LABEL_PATTERN = /^(rooms?|labs?|venues?)$/i;
const END_MARKER_PATTERN = /colou?r keys?/i;
const INLINE_COURSE_PATTERN = /^(.+?)\s*\(([^()]*[A-Z]{2,}\s*-?\s*\d[^()]*)\)\s*:\s*(.*)$/is;
const MIN_HEADER_SLOTS = 2;
const LABEL_SEARCH_ROWS = 2;
const MAX_BLOCK_ROWS = 4;
const EARLIEST_MINUTES = 7 * 60;
const LATEST_MINUTES = 22 * 60;

function overlaps(a, b) {
  return Math.min(a.c1, b.c1) >= Math.max(a.c0, b.c0);
}

function overlapWidth(a, b) {
  return Math.min(a.c1, b.c1) - Math.max(a.c0, b.c0) + 1;
}

function findLabel(grid, row, firstSlotCol) {
  for (let offset = 0; offset <= LABEL_SEARCH_ROWS && row + offset <= grid.lastRow; offset += 1) {
    const label = grid
      .rowCells(row + offset)
      .filter((cell) => cell.c1 < firstSlotCol && HEADER_LABEL_PATTERN.test(cell.text))
      .sort((a, b) => b.c0 - a.c0)[0];
    if (label) return { ...label, row: row + offset };
  }
  return null;
}

function readHeader(grid, row) {
  const slots = grid
    .rowCells(row)
    .filter((cell) => isTimeOnly(cell.text))
    .map((cell) => ({ c0: cell.c0, c1: cell.c1, ...extractTimeRange(cell.text).range }));
  if (slots.length < MIN_HEADER_SLOTS) return null;

  const label = findLabel(grid, row, Math.min(...slots.map((slot) => slot.c0)));
  if (!label) return null;

  return {
    labelCol: label.c0,
    dataCol: label.c1 + 1,
    nextRow: label.row + 1,
    kind: /lab/i.test(label.text) ? "lab" : "class",
    clock: createColumnClock(slots),
  };
}

function findDay(grid, header, r0, r1) {
  for (let row = r0; row <= r1; row += 1) {
    const dayCell = grid.rowCells(row).find((cell) => cell.c1 < header.labelCol && dayFromText(cell.text) !== null);
    if (dayCell) return dayFromText(dayCell.text);
  }
  return null;
}

function findBlockEnd(grid, header, row) {
  const merged = grid.extent(row, header.labelCol);
  if (merged.r1 > row) return merged.r1;

  let end = row;
  while (end + 1 <= grid.lastRow && end - row + 1 < MAX_BLOCK_ROWS) {
    const next = end + 1;
    if (grid.text(next, header.labelCol) || readHeader(grid, next)) break;
    end = next;
  }
  return end;
}

function closestAbove(candidates, cell) {
  return candidates
    .filter((candidate) => candidate.cell.r1 < cell.r0 && overlaps(candidate.cell, cell))
    .sort((a, b) => b.cell.r1 - a.cell.r1 || overlapWidth(b.cell, cell) - overlapWidth(a.cell, cell))[0];
}

function pairCourses(cells) {
  const courses = [];
  cells.forEach((cell) => {
    const owner = closestAbove(courses, cell);
    if (owner && !owner.instructorCell) {
      owner.instructorCell = cell;
      return;
    }
    if (!looksLikeInstructor(cell.text)) courses.push({ cell, instructorCell: null });
  });
  return courses;
}

function markerAbove(markers, cell) {
  return markers.filter((marker) => marker.r1 < cell.r0 && overlaps(marker, cell)).sort((a, b) => b.r1 - a.r1)[0];
}

function isValidRange(range) {
  return Boolean(range) && range.end > range.start && range.start >= EARLIEST_MINUTES && range.end <= LATEST_MINUTES;
}

function toEntry({ name, section, instructor, room, day, range, headerKind }) {
  const lab = headerKind === "lab" || isLabName(name);
  return {
    code: "",
    name: lab && !isLabName(name) ? `${name} Lab` : name,
    shortName: "",
    section,
    instructor,
    room,
    day,
    start: range.start,
    end: range.end,
    kind: lab ? "lab" : "class",
    type: "core",
    batch: "",
  };
}

function parseInlineCell(cell, context) {
  const { range: explicit, rest } = extractTimeRange(collapseSpaces(cell.text));
  const match = INLINE_COURSE_PATTERN.exec(rest);
  const range = explicit || context.header.clock.span(cell.c0, cell.c1);
  const name = collapseSpaces(match[1]);
  if (!name || !isValidRange(range)) return [];

  const instructor = cleanInstructor(match[3]);
  return expandSections(match[2]).map((section) =>
    toEntry({ ...context, name, section, instructor, range, headerKind: context.header.kind })
  );
}

function parsePairedCourse(course, markers, context) {
  const courseTime = extractTimeRange(course.cell.text);
  const instructorTime = course.instructorCell ? extractTimeRange(course.instructorCell.text) : { range: null, rest: "" };
  const marker = markerAbove(markers, course.cell);
  const range =
    instructorTime.range ||
    courseTime.range ||
    (marker && extractTimeRange(marker.text).range) ||
    context.header.clock.span(course.cell.c0, course.cell.c1);
  const parsed = splitCourseText(courseTime.rest);
  if (!parsed.name || !isValidRange(range)) return [];

  const instructor = instructorTime.rest ? cleanInstructor(instructorTime.rest) : "";
  return [toEntry({ ...context, ...parsed, instructor, range, headerKind: context.header.kind })];
}

function parseRoomBlock(grid, context, r0, r1) {
  const cells = [];
  for (let row = r0; row <= r1; row += 1) {
    cells.push(...grid.rowCells(row, context.header.dataCol));
  }

  const markers = cells.filter((cell) => isTimeOnly(cell.text));
  const texts = cells.filter((cell) => !isTimeOnly(cell.text) && !isIgnoredText(cell.text));
  const inline = texts.filter((cell) => INLINE_COURSE_PATTERN.test(collapseSpaces(cell.text)));
  const paired = texts
    .filter((cell) => !inline.includes(cell))
    .sort((a, b) => a.r0 - b.r0 || a.c0 - b.c0);

  return [
    ...inline.flatMap((cell) => parseInlineCell(cell, context)),
    ...pairCourses(paired).flatMap((course) => parsePairedCourse(course, markers, context)),
  ];
}

function parseSheet(sheet) {
  const grid = createSheetGrid(sheet);
  if (!grid) return [];

  const entries = [];
  let header = null;
  let day = null;
  let row = grid.firstRow;

  while (row <= grid.lastRow) {
    if (grid.rowCells(row).some((cell) => END_MARKER_PATTERN.test(cell.text))) break;

    const nextHeader = readHeader(grid, row);
    if (nextHeader) {
      header = nextHeader;
      row = nextHeader.nextRow;
      continue;
    }

    const roomText = header ? grid.text(row, header.labelCol) : "";
    if (!header || !roomText || grid.isCovered(row, header.labelCol)) {
      row += 1;
      continue;
    }

    const blockEnd = findBlockEnd(grid, header, row);
    day = findDay(grid, header, row, blockEnd) ?? day;

    if (day !== null) {
      entries.push(...parseRoomBlock(grid, { header, day, room: collapseSpaces(roomText) }, row, blockEnd));
    }
    row = blockEnd + 1;
  }

  return entries;
}

export const roomGridFormat = {
  id: "room-grid",
  label: "Rooms by time slot, grouped by day",
  priority: 1,

  parse(workbook) {
    return (
      workbook.SheetNames.map((sheetName) => ({ sheetName, entries: parseSheet(workbook.Sheets[sheetName]) }))
        .filter((result) => result.entries.length > 0)
        .sort((a, b) => b.entries.length - a.entries.length)[0] || null
    );
  },
};
