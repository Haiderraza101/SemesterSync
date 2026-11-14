import { collapseSpaces, courseKey, isLabName, nameTokens } from "./courseText.js";
import { createSheetGrid } from "./sheetGrid.js";

const CODE_PATTERN = /^[A-Z]{2,3}\s?-?\d{3,4}[A-Z]?$/;
const MIN_PREFIX_LENGTH = 3;
const MIN_ABBREVIATION_LENGTH = 4;
const MIN_COVERAGE = 0.6;

function normalizeCode(code) {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

function isAbbreviationOf(short, long) {
  if (short.length < MIN_ABBREVIATION_LENGTH || short.length >= long.length || short[0] !== long[0]) return false;
  let position = 0;
  for (const letter of long) {
    if (letter === short[position]) position += 1;
    if (position === short.length) return true;
  }
  return false;
}

function tokensMatch(a, b) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < MIN_PREFIX_LENGTH) return false;
  return a.startsWith(b) || b.startsWith(a) || isAbbreviationOf(a, b) || isAbbreviationOf(b, a);
}

export function readCourseCodes(workbook) {
  const byCode = new Map();

  workbook.SheetNames.forEach((sheetName) => {
    const grid = createSheetGrid(workbook.Sheets[sheetName]);
    if (!grid) return;

    for (let row = grid.firstRow; row <= grid.lastRow; row += 1) {
      const cells = grid.rowCells(row);
      cells.forEach((cell, index) => {
        if (!CODE_PATTERN.test(cell.text)) return;
        const nameCell = cells.slice(index + 1).find((candidate) => /[a-z]{3,}/i.test(candidate.text));
        const code = normalizeCode(cell.text);
        if (!nameCell || byCode.has(code)) return;
        const name = collapseSpaces(nameCell.text).replace(/\.\s*(lab)\b/i, " $1");
        byCode.set(code, { code, name, key: courseKey(name), tokens: nameTokens(name), lab: isLabName(name) });
      });
    }
  });

  return [...byCode.values()];
}

export function createCodeMatcher(codes) {
  const byKey = new Map(codes.map((entry) => [entry.key, entry]));
  const cache = new Map();

  function score(tokens, candidate) {
    if (tokens.length === 0) return 0;
    const allMatched = tokens.every((token) => candidate.tokens.some((other) => tokensMatch(token, other)));
    if (!allMatched) return 0;
    const covered = candidate.tokens.filter((other) => tokens.some((token) => tokensMatch(token, other))).length;
    return covered / candidate.tokens.length;
  }

  return function match(name) {
    const key = courseKey(name);
    if (cache.has(key)) return cache.get(key);

    let result = byKey.get(key) || null;
    if (!result) {
      const tokens = nameTokens(name);
      const lab = isLabName(name);
      const best = codes
        .filter((candidate) => candidate.lab === lab)
        .map((candidate) => ({ candidate, value: score(tokens, candidate) }))
        .filter(({ value }) => value >= MIN_COVERAGE)
        .sort((a, b) => b.value - a.value)[0];
      result = best?.candidate || null;
    }

    cache.set(key, result);
    return result;
  };
}
