import { createSheetGrid } from "./sheetGrid.js";

const SEMESTER_PATTERN = /\b(fall|spring|summer)\s*[-–]?\s*(20\d{2})\b/i;
const TITLE_SCAN_ROWS = 6;

export function titleLines(workbook) {
  return workbook.SheetNames.flatMap((sheetName) => {
    const grid = createSheetGrid(workbook.Sheets[sheetName]);
    if (!grid) return [];
    const lines = [];
    const lastRow = Math.min(grid.lastRow, grid.firstRow + TITLE_SCAN_ROWS);
    for (let row = grid.firstRow; row <= lastRow; row += 1) {
      lines.push(...grid.rowCells(row).map((cell) => cell.text));
    }
    return lines;
  });
}

export function detectSemesterName(workbook) {
  const match = titleLines(workbook)
    .map((line) => SEMESTER_PATTERN.exec(line))
    .find(Boolean);
  if (!match) return "";
  return `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()} ${match[2]}`;
}
