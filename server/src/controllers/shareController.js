import ShareCode from "../models/ShareCode.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateShareCode, isValidShareCode, normalizeShareCode } from "../utils/shareCode.js";

const MAX_ATTEMPTS = 5;

async function createUniqueCode(owner, selections) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await ShareCode.create({ code: generateShareCode(), owner, selections });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw new AppError("Could not generate a share code. Please try again.", 503);
}

export const createShareCode = asyncHandler(async (req, res) => {
  const selections = req.body.selections.map(({ code, section }) => ({ code, section }));
  await ShareCode.deleteMany({ owner: req.user._id });
  const shareCode = await createUniqueCode(req.user._id, selections);
  res.status(201).json({ code: shareCode.code });
});

export const getShareCode = asyncHandler(async (req, res) => {
  const code = normalizeShareCode(req.params.code);
  if (!isValidShareCode(code)) throw new AppError("Share codes look like ABCD-1234.", 400);

  const shareCode = await ShareCode.findOne({ code }).populate("owner", "name section");
  if (!shareCode || !shareCode.owner) throw new AppError("No schedule was found for this code.", 404);

  res.json({
    code: shareCode.code,
    owner: shareCode.owner.name,
    section: shareCode.owner.section,
    selections: shareCode.selections,
  });
});

export const disableShareCode = asyncHandler(async (req, res) => {
  await ShareCode.deleteMany({ owner: req.user._id });
  res.status(204).end();
});
