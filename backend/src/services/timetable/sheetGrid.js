import * as XLSX from "xlsx";

function cellKey(row, col) {
  return `${row}:${col}`;
}

function cellText(cell) {
  if (!cell || cell.v === undefined || cell.v === null) return "";
  const raw = cell.w !== undefined && typeof cell.v !== "string" ? cell.w : cell.v;
  return String(raw).replace(/ /g, " ").trim();
}

export function readWorkbook(buffer) {
  return XLSX.read(buffer, {
    type: "buffer",
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
    cellDates: false,
  });
}

export function createSheetGrid(sheet) {
  if (!sheet || !sheet["!ref"]) return null;

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const merges = new Map();
  const covered = new Set();

  (sheet["!merges"] || []).forEach(({ s, e }) => {
    merges.set(cellKey(s.r, s.c), { r0: s.r, c0: s.c, r1: e.r, c1: e.c });
    for (let row = s.r; row <= e.r; row += 1) {
      for (let col = s.c; col <= e.c; col += 1) {
        if (row !== s.r || col !== s.c) covered.add(cellKey(row, col));
      }
    }
  });

  return {
    firstRow: range.s.r,
    lastRow: range.e.r,
    firstCol: range.s.c,
    lastCol: range.e.c,

    text(row, col) {
      return cellText(sheet[XLSX.utils.encode_cell({ r: row, c: col })]);
    },

    isCovered(row, col) {
      return covered.has(cellKey(row, col));
    },

    extent(row, col) {
      return merges.get(cellKey(row, col)) || { r0: row, c0: col, r1: row, c1: col };
    },

    rowCells(row, fromCol = range.s.c) {
      const cells = [];
      for (let col = fromCol; col <= range.e.c; col += 1) {
        if (covered.has(cellKey(row, col))) continue;
        const text = cellText(sheet[XLSX.utils.encode_cell({ r: row, c: col })]);
        if (text) cells.push({ ...this.extent(row, col), text });
      }
      return cells;
    },
  };
}
