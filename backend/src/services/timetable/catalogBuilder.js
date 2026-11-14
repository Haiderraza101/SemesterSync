import { courseKey, nameTokens, shortenName } from "./courseText.js";
import { formatMinutes } from "./timeText.js";

export const CATALOG_VERSION = 2;

export const COURSE_COLORS = ["#2f5f98", "#9a6b2f", "#3d7a74", "#5b6672", "#7b8fa6", "#1f3a5c", "#9aa5b1"];

function increment(counter, value) {
  if (value) counter.set(value, (counter.get(value) || 0) + 1);
}

function mostCommon(counter) {
  return [...counter.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "";
}

function generatedCode(name, taken) {
  const base =
    nameTokens(name)
      .map((token) => token[0].toUpperCase())
      .join("")
      .slice(0, 6) || "COURSE";
  let code = base;
  for (let suffix = 2; taken.has(code); suffix += 1) code = `${base}${suffix}`;
  taken.add(code);
  return code;
}

function groupEntries(entries, matchCode) {
  const groups = new Map();

  entries.forEach((entry) => {
    const official = entry.code ? { code: entry.code, name: null } : matchCode(entry.name);
    const groupKey = official ? `code:${official.code}` : `name:${courseKey(entry.name)}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, { official, names: new Map(), shortNames: new Map(), kinds: new Map(), sections: new Map() });
    }
    const group = groups.get(groupKey);
    increment(group.names, entry.name);
    increment(group.shortNames, entry.shortName);
    increment(group.kinds, entry.kind);

    if (!group.sections.has(entry.section)) {
      group.sections.set(entry.section, {
        instructors: new Map(),
        rooms: new Map(),
        types: new Map(),
        batches: new Map(),
        slots: new Map(),
      });
    }
    const section = group.sections.get(entry.section);
    increment(section.instructors, entry.instructor);
    increment(section.rooms, entry.room);
    increment(section.types, entry.type);
    increment(section.batches, entry.batch);
    section.slots.set(`${entry.day}-${entry.start}-${entry.end}`, entry);
  });

  return [...groups.values()];
}

function buildSections(sections) {
  const sorted = [...sections.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  return Object.fromEntries(
    sorted.map(([sectionName, section]) => [
      sectionName,
      {
        instructor: mostCommon(section.instructors),
        room: mostCommon(section.rooms),
        type: mostCommon(section.types) || "core",
        batch: mostCommon(section.batches),
        slots: [...section.slots.values()]
          .sort((a, b) => a.day - b.day || a.start - b.start)
          .map((slot) => ({ day: slot.day, start: formatMinutes(slot.start), end: formatMinutes(slot.end), room: slot.room })),
      },
    ])
  );
}

export function buildCatalog(entries, { matchCode, fileName, fileSize, format, sheetName }) {
  const groups = groupEntries(entries, matchCode).map((group) => ({
    ...group,
    name: group.official?.name || mostCommon(group.names),
  }));
  groups.sort((a, b) => a.name.localeCompare(b.name));

  const takenCodes = new Set(groups.filter((group) => group.official).map((group) => group.official.code));

  const courses = groups.map((group, index) => ({
    code: group.official?.code || generatedCode(group.name, takenCodes),
    name: group.name,
    shortName: mostCommon(group.shortNames) || shortenName(group.name),
    kind: mostCommon(group.kinds) || "class",
    color: COURSE_COLORS[index % COURSE_COLORS.length],
    sections: buildSections(group.sections),
  }));

  return {
    version: CATALOG_VERSION,
    fileName,
    fileSize,
    uploadedAt: new Date().toISOString(),
    format,
    sheetName,
    totalSections: courses.reduce((total, course) => total + Object.keys(course.sections).length, 0),
    courses,
  };
}
