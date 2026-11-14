import ShareCode from "../models/ShareCode.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateShareCode, isValidShareCode, normalizeShareCode } from "../utils/shareCode.js";

const MAX_ATTEMPTS = 5;

async function createUniqueCode(owner, content) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await ShareCode.create({ code: generateShareCode(), owner, ...content });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw new AppError("Could not generate a share code. Please try again.", 503, { code: "SHARE_CODE_UNAVAILABLE" });
}

export const getMyShareCode = asyncHandler(async (req, res) => {
  const shareCode = await ShareCode.findOne({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ code: shareCode?.code || null });
});

export const createShareCode = asyncHandler(async (req, res) => {
  const { selections, exams, tasks } = req.body;
  await ShareCode.deleteMany({ owner: req.user._id });
  const shareCode = await createUniqueCode(req.user._id, {
    selections: selections.map(({ code, section }) => ({ code, section })),
    exams,
    tasks,
  });
  res.status(201).json({ code: shareCode.code });
});

export const getShareCode = asyncHandler(async (req, res) => {
  const code = normalizeShareCode(req.params.code);
  if (!isValidShareCode(code)) {
    throw new AppError("Share codes look like ABCD-1234.", 400, { code: "INVALID_SHARE_CODE" });
  }

  const shareCode = await ShareCode.findOne({ code }).populate("owner", "name section");
  if (!shareCode || !shareCode.owner) {
    throw new AppError("No schedule was found for this code.", 404, { code: "SHARE_CODE_NOT_FOUND" });
  }

  res.json({
    code: shareCode.code,
    owner: shareCode.owner.name,
    section: shareCode.owner.section,
    selections: shareCode.selections,
    exams: shareCode.exams,
    tasks: shareCode.tasks,
  });
});

export const disableShareCode = asyncHandler(async (req, res) => {
  await ShareCode.deleteMany({ owner: req.user._id });
  res.status(204).end();
});
