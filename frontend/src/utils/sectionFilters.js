export const CATALOG_VERSION = 2;

export function isOutdatedCatalog(catalog) {
  return Boolean(catalog) && (catalog.version || 1) < CATALOG_VERSION;
}

export const SCOPES = {
  section: "section",
  semester: "semester",
  all: "all",
};

export const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "core", label: "Core" },
  { value: "elective", label: "Electives" },
  { value: "lab", label: "Labs" },
  { value: "repeat", label: "Repeat courses" },
];

export const TYPE_LABELS = { core: "Core", elective: "Elective", repeat: "Repeat" };

const USER_SECTION_PATTERN = /^([A-Z]+)(\d{1,2})([A-Z]\d?)$/;

export function normalizeSection(section) {
  return String(section || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function parseUserSection(section) {
  const key = normalizeSection(section);
  const match = USER_SECTION_PATTERN.exec(key);
  if (!match) return { key, label: section || "", semesterKey: "", semesterLabel: "" };
  return { key, label: section, semesterKey: `${match[1]}${match[2]}`, semesterLabel: `${match[1]}-${match[2]}` };
}

function inSemester(sectionName, semesterKey) {
  const key = normalizeSection(sectionName);
  return Boolean(semesterKey) && key.startsWith(semesterKey) && /^[A-Z]/.test(key.slice(semesterKey.length));
}

export function findUserSection(course, user) {
  if (!user.key) return null;
  return Object.keys(course.sections).find((name) => normalizeSection(name) === user.key) || null;
}

export function defaultSection(course, user) {
  const names = Object.keys(course.sections);
  return findUserSection(course, user) || names.find((name) => inSemester(name, user.semesterKey)) || names[0];
}

export function getBatchOptions(catalog) {
  const batches = new Set();
  catalog.courses.forEach((course) =>
    Object.values(course.sections).forEach((details) => details.batch && batches.add(details.batch))
  );
  return [...batches].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function isSectionVisible(course, sectionName, details, { scope, type, batch }, user) {
  if (scope === SCOPES.section && normalizeSection(sectionName) !== user.key) return false;
  if (scope === SCOPES.semester && !inSemester(sectionName, user.semesterKey)) return false;
  if (type === "lab" && course.kind !== "lab") return false;
  if (type !== "all" && type !== "lab" && (details.type || "core") !== type) return false;
  if (batch !== "all" && details.batch !== batch) return false;
  return true;
}

export function getVisibleSections(course, filters, user) {
  return Object.entries(course.sections)
    .filter(([name, details]) => isSectionVisible(course, name, details, filters, user))
    .map(([name]) => name);
}

export function matchesSearch(course, sectionNames, term) {
  if (!term) return true;
  const fields = [course.name, course.code, course.shortName];
  if (fields.some((field) => field?.toLowerCase().includes(term))) return true;
  return sectionNames.some(
    (name) => name.toLowerCase().includes(term) || course.sections[name].instructor?.toLowerCase().includes(term)
  );
}
