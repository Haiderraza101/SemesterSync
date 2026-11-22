import Schedule from "../models/Schedule.js";
import ShareCode from "../models/ShareCode.js";
import AppError from "../utils/AppError.js";
import { EXAM_TERMS } from "../utils/examTerms.js";
import { generateShareCode } from "../utils/shareCode.js";

const MAX_ATTEMPTS = 5;

function courseOf(id) {
  return String(id).split("_")[0];
}

async function requireCourses(ownerId) {
  const schedule = await Schedule.findOne({ user: ownerId }).select("selections").lean();
  if (!schedule?.selections?.length) {
    throw new AppError("Select at least one course before sharing.", 400, { code: "NOTHING_TO_SHARE" });
  }
}

async function createUniqueCode(owner, include) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await ShareCode.create({ code: generateShareCode(), owner, include });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw new AppError("Could not generate a share code. Please try again.", 503, { code: "SHARE_CODE_UNAVAILABLE" });
}

export async function getOwnShareCode(ownerId) {
  return ShareCode.findOne({ owner: ownerId }).sort({ createdAt: -1 });
}

export async function saveShareCode(ownerId, { include, regenerate }) {
  await requireCourses(ownerId);
  const existing = await getOwnShareCode(ownerId);
  if (existing && !regenerate) {
    existing.include = include;
    await existing.save();
    return existing;
  }
  await ShareCode.deleteMany({ owner: ownerId });
  return createUniqueCode(ownerId, include);
}

export async function disableShareCodes(ownerId) {
  await ShareCode.deleteMany({ owner: ownerId });
}

export function buildSharedSchedule(schedule, include = {}) {
  const selections = (schedule?.selections || []).map(({ code, section }) => ({ code, section }));
  const codes = new Set(selections.map((selection) => selection.code));
  const shared = (code) => codes.has(code);

  const exams =
    include.exams === false
      ? []
      : EXAM_TERMS.flatMap((term) =>
          (schedule?.dateSheets?.[term]?.exams || [])
            .filter((exam) => shared(exam.code))
            .map(({ code, date, start, end }) => ({ term, code, date, start, end }))
        );

  const tasks =
    include.tasks === false
      ? []
      : (schedule?.tasks || [])
          .filter((task) => !task.courseCode || shared(task.courseCode))
          .map(({ title, courseCode, type, due, lectureId }) => ({
            title,
            courseCode: courseCode || "",
            type: type || "assignment",
            due,
            ...(lectureId && { lectureId }),
          }));

  const makeups =
    include.changes === false
      ? []
      : (schedule?.makeups || [])
          .filter((makeup) => shared(makeup.code))
          .map(({ id, code, date, start, end, room }) => ({ id, code, date, start, end, room }));

  const cancelled = include.changes === false ? [] : (schedule?.cancelled || []).filter((id) => shared(courseOf(id)));

  return { selections, exams, tasks, makeups, cancelled };
}

export async function lookupShareCode(code) {
  const shareCode = await ShareCode.findOne({ code }).populate("owner", "name section");
  if (!shareCode || !shareCode.owner) {
    throw new AppError("No schedule was found for this code.", 404, { code: "SHARE_CODE_NOT_FOUND" });
  }
  const schedule = await Schedule.findOne({ user: shareCode.owner._id }).lean();
  const content = buildSharedSchedule(schedule, shareCode.include || {});
  if (content.selections.length === 0) {
    throw new AppError("This schedule has no courses to share right now.", 404, { code: "SHARE_CODE_EMPTY" });
  }
  return {
    code: shareCode.code,
    owner: shareCode.owner.name,
    section: shareCode.owner.section,
    updatedAt: schedule?.updatedAt || null,
    ...content,
  };
}
