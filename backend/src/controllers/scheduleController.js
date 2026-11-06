import Schedule, { EDITABLE_SCHEDULE_FIELDS } from "../models/Schedule.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function findOrCreateSchedule(userId) {
  const existing = await Schedule.findOne({ user: userId });
  return existing || Schedule.create({ user: userId });
}

export const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await findOrCreateSchedule(req.user._id);
  res.json({ schedule });
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await findOrCreateSchedule(req.user._id);

  EDITABLE_SCHEDULE_FIELDS.forEach((field) => {
    if (req.body[field] === undefined) return;
    if (field === "settings") {
      schedule.settings = { ...schedule.settings.toObject(), ...req.body.settings };
    } else {
      schedule.set(field, req.body[field]);
    }
  });

  await schedule.save();
  res.json({ schedule });
});

export const resetSchedule = asyncHandler(async (req, res) => {
  await Schedule.deleteOne({ user: req.user._id });
  const schedule = await Schedule.create({ user: req.user._id });
  res.json({ schedule });
});
