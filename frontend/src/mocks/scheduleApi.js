import { delay } from "./delay.js";
import { SAMPLE_CATALOG, SAMPLE_DATE_SHEETS, SHARED_SCHEDULES } from "./schedule.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomBlock(length) {
  let block = "";
  for (let index = 0; index < length; index += 1) {
    block += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return block;
}

export const mockScheduleApi = {
  async parseTimetable(file) {
    await delay(700);
    return { ...SAMPLE_CATALOG, fileName: file.name, fileSize: file.size, uploadedAt: new Date().toISOString() };
  },

  async parseDateSheet(file, term) {
    await delay(600);
    const sheet = SAMPLE_DATE_SHEETS[term];
    return { fileName: file.name, totalPapers: sheet.totalPapers, exams: sheet.exams };
  },

  async createShareCode() {
    await delay(300);
    return { code: `${randomBlock(4)}-${randomBlock(4)}` };
  },

  async lookupShareCode(code) {
    await delay(400);
    const schedule = SHARED_SCHEDULES[code];
    if (!schedule) throw new Error("No schedule was found for this code.");
    return { code, ...schedule };
  },
};
