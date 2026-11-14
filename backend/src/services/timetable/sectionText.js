const PROGRAM_SECTION_PATTERN = /^([A-Z]{2,5})\s*-\s*(\d{1,2}[A-Z]\d?)$/i;
const BARE_SECTION_PATTERN = /^(\d{1,2}[A-Z]\d?)$/i;

export function expandSections(text) {
  const parts = String(text)
    .split(/[/,&]/)
    .map((part) => part.trim())
    .filter(Boolean);

  let program = null;
  const sections = [];

  parts.forEach((part) => {
    const full = PROGRAM_SECTION_PATTERN.exec(part);
    if (full) {
      program = full[1].toUpperCase();
      sections.push(`${program}-${full[2].toUpperCase()}`);
      return;
    }
    const bare = BARE_SECTION_PATTERN.exec(part);
    if (bare && program) {
      sections.push(`${program}-${bare[1].toUpperCase()}`);
      return;
    }
    sections.push(part.toUpperCase().replace(/\s+/g, " "));
  });

  return [...new Set(sections)];
}
