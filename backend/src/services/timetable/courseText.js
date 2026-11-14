const IGNORED_TEXT_PATTERN = /\b(re?se?rve?d|juma|prayer|break|colou?r keys?|lunch|vacant|not available)\b/i;
const INSTRUCTOR_TITLE_PATTERN = /^(dr|mr|mrs|ms|miss|engr|prof|sir|madam|mam)\b\.?/i;
const SECTION_PATTERN =
  /(?:\s+|(?<=[a-z.)]))((?:[A-Z]{2,4}(?:\s*[,/]\s*[A-Z]{2,4})*)\s*[- ]\s*[A-Z]\d?|[A-Z]\d?)$/;
const NOTE_SPLIT_PATTERN = /\s{3,}/;
const PARENTHESES_PATTERN = /\([^)]*\)/g;
const STOP_WORDS = new Set(["of", "and", "the", "in", "for", "to", "a", "an", "with"]);

export const DEFAULT_SECTION = "A";

export function collapseSpaces(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function isIgnoredText(text) {
  return IGNORED_TEXT_PATTERN.test(text);
}

export function looksLikeInstructor(text) {
  return INSTRUCTOR_TITLE_PATTERN.test(text.trim());
}

function titleCase(title) {
  return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
}

export function cleanInstructor(text) {
  const [name] = text.trim().split(NOTE_SPLIT_PATTERN);
  return collapseSpaces(
    name
      .replace(/^(dr|mr|mrs|ms|engr|prof)\s*[.,]?\s*/i, (match, title) => `${titleCase(title)}. `)
      .replace(/[.,;:-]+$/, "")
  );
}

function normalizeSection(section) {
  return section
    .toUpperCase()
    .replace(/\s*([,/])\s*/g, ",")
    .replace(/\s*[- ]\s*([A-Z]\d?)$/, "-$1");
}

export function splitCourseText(text) {
  const [title] = text.trim().split(NOTE_SPLIT_PATTERN);
  const cleaned = collapseSpaces(title.replace(PARENTHESES_PATTERN, " ")).replace(/[,;:-]+$/, "").trim();
  const match = SECTION_PATTERN.exec(cleaned);

  if (!match || match.index === 0) return { name: cleaned, section: DEFAULT_SECTION };

  const name = cleaned.slice(0, match.index).replace(/[-–\s]+$/, "").trim();
  if (!name) return { name: cleaned, section: DEFAULT_SECTION };
  return { name, section: normalizeSection(match[1]) };
}

export function courseKey(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

export function nameTokens(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));
}

export function isLabName(name) {
  return /\blab(s|oratory)?\b/i.test(name);
}

export function shortenName(name, limit = 18) {
  if (name.length <= limit) return name;
  const lab = isLabName(name);
  const acronym = name
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()) && !(lab && /^lab/i.test(word)))
    .map((word) => word[0].toUpperCase())
    .join("");
  return lab ? `${acronym} Lab` : acronym;
}
