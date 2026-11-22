import * as shareService from "../services/shareService.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidShareCode, normalizeShareCode } from "../utils/shareCode.js";

function toResponse(shareCode) {
  if (!shareCode) return { code: null, include: null };
  const { exams = true, tasks = true, changes = true } = shareCode.include || {};
  return { code: shareCode.code, include: { exams, tasks, changes } };
}

export const getMyShareCode = asyncHandler(async (req, res) => {
  res.json(toResponse(await shareService.getOwnShareCode(req.user._id)));
});

export const createShareCode = asyncHandler(async (req, res) => {
  const shareCode = await shareService.saveShareCode(req.user._id, req.body);
  res.status(201).json(toResponse(shareCode));
});

export const getShareCode = asyncHandler(async (req, res) => {
  const code = normalizeShareCode(req.params.code);
  if (!isValidShareCode(code)) {
    throw new AppError("Share codes look like ABCD-1234.", 400, { code: "INVALID_SHARE_CODE" });
  }
  res.json(await shareService.lookupShareCode(code));
});

export const disableShareCode = asyncHandler(async (req, res) => {
  await shareService.disableShareCodes(req.user._id);
  res.status(204).end();
});
