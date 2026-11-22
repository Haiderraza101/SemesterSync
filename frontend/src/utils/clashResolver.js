import { findClashes, slotsOverlap } from "./clashes.js";
import { SHORT_DAY_NAMES, formatTime } from "./date.js";
import { inSemester, normalizeSection } from "./sectionFilters.js";

const MAX_NODES = 250000;
const MAX_SOLUTIONS = 2000;

function sectionRank(sectionName, user) {
  if (user.key && normalizeSection(sectionName) === user.key) return 0;
  if (inSemester(sectionName, user.semesterKey)) return 1;
  return 2;
}

export function describeSlots(slots) {
  return slots.map((slot) => `${SHORT_DAY_NAMES[slot.day]} ${formatTime(slot.start).replace(/:00(?= )/, "")}`).join(", ");
}

function sectionCandidates(course, currentSection, user) {
  return Object.entries(course.sections)
    .filter(([, details]) => details.slots?.length)
    .map(([section, details]) => ({
      kind: section === currentSection ? "keep" : "move",
      from: course.code,
      course,
      code: course.code,
      section,
      fromSection: currentSection,
      slots: details.slots,
      rank: section === currentSection ? -1 : sectionRank(section, user),
    }));
}

function electiveCandidates(course, catalog, draft, excluded, user) {
  return catalog.courses
    .filter((other) => other.code !== course.code && !draft[other.code]?.included && !excluded.has(other.code))
    .flatMap((other) =>
      Object.entries(other.sections)
        .filter(([section, details]) => details.type === "elective" && details.slots?.length)
        .filter(([section]) => !user.semesterKey || inSemester(section, user.semesterKey))
        .map(([section, details]) => ({
          kind: "swap",
          from: course.code,
          course: other,
          replaces: course,
          code: other.code,
          section,
          fromSection: draft[course.code].section,
          slots: details.slots,
          rank: 3 + sectionRank(section, user),
        }))
    );
}

function fits(slots, used) {
  return slots.every((slot) => used.every((taken) => !slotsOverlap(slot, taken)));
}

export function findClashFixes({ catalog, draft, user, limit = 8 }) {
  const selected = catalog.courses.filter((course) => draft[course.code]?.included);
  const selectedCourses = selected.map((course) => ({
    ...course,
    section: draft[course.code].section,
    slots: course.sections[draft[course.code].section]?.slots || [],
  }));
  const clashes = findClashes(selectedCourses);
  if (clashes.length === 0) return { groups: [], total: 0, exhausted: false };

  const conflicted = new Set(clashes.flatMap((clash) => clash.courses.map((course) => course.code)));
  const fixedSlots = selectedCourses.filter((course) => !conflicted.has(course.code)).flatMap((course) => course.slots);
  const selectedCodes = new Set(selected.map((course) => course.code));

  const groups = selected
    .filter((course) => conflicted.has(course.code))
    .map((course) => {
      const currentSection = draft[course.code].section;
      const isElective = course.sections[currentSection]?.type === "elective";
      const candidates = [
        ...sectionCandidates(course, currentSection, user),
        ...(isElective ? electiveCandidates(course, catalog, draft, selectedCodes, user) : []),
      ].filter((candidate) => fits(candidate.slots, fixedSlots));
      candidates.sort((a, b) => a.rank - b.rank || a.section.localeCompare(b.section, undefined, { numeric: true }));
      return { course, candidates };
    })
    .sort((a, b) => a.candidates.length - b.candidates.length);

  const solutions = [];
  let nodes = 0;
  let exhausted = false;

  const search = (index, used, usedCodes, picks, changeCount, target) => {
    if (solutions.length >= MAX_SOLUTIONS) return;
    nodes += 1;
    if (nodes > MAX_NODES) {
      exhausted = true;
      return;
    }
    if (index === groups.length) {
      if (changeCount === target) solutions.push(picks.filter((pick) => pick.kind !== "keep"));
      return;
    }
    const remaining = groups.length - index;
    for (const candidate of groups[index].candidates) {
      const nextCount = changeCount + (candidate.kind === "keep" ? 0 : 1);
      if (nextCount > target || nextCount + remaining - 1 < target) continue;
      if (candidate.kind === "swap" && usedCodes.has(candidate.code)) continue;
      if (!fits(candidate.slots, used)) continue;
      usedCodes.add(candidate.code);
      search(index + 1, [...used, ...candidate.slots], usedCodes, [...picks, candidate], nextCount, target);
      if (candidate.kind === "swap") usedCodes.delete(candidate.code);
      if (solutions.length >= MAX_SOLUTIONS || nodes > MAX_NODES) return;
    }
  };

  for (let target = 1; target <= groups.length && solutions.length < MAX_SOLUTIONS && !exhausted; target += 1) {
    search(0, fixedSlots, new Set(selectedCodes), [], 0, target);
  }

  const score = (changes) => changes.reduce((total, change) => total + change.rank, 0);
  solutions.sort(
    (a, b) =>
      a.length - b.length ||
      a.filter((change) => change.kind === "swap").length - b.filter((change) => change.kind === "swap").length ||
      score(a) - score(b)
  );

  const options = solutions.map((changes, index) => ({
      id: `${index}-${changes.map((change) => `${change.code}:${change.section}`).join("|")}`,
      changes: changes.map((change) => ({
        kind: change.kind,
        from: change.from,
        code: change.code,
        section: change.section,
        fromSection: change.fromSection,
        name: change.course.name,
        replacedName: change.replaces?.name,
        when: describeSlots(change.slots),
      })),
    }));

  const fixGroups = new Map();
  options.forEach((option) => {
    const signature = option.changes.map((change) => `${change.kind}:${change.from}`).sort().join("|");
    if (!fixGroups.has(signature)) fixGroups.set(signature, { id: signature, changes: option.changes, options: [] });
    fixGroups.get(signature).options.push(option);
  });

  return {
    total: solutions.length,
    exhausted: exhausted || solutions.length >= MAX_SOLUTIONS,
    groups: [...fixGroups.values()].slice(0, limit),
  };
}

export function applyClashFix(draft, option) {
  const next = { ...draft };
  option.changes.forEach((change) => {
    if (change.kind === "swap") {
      next[change.from] = { ...next[change.from], included: false };
      next[change.code] = { included: true, section: change.section };
    } else {
      next[change.code] = { ...next[change.code], included: true, section: change.section };
    }
  });
  return next;
}
