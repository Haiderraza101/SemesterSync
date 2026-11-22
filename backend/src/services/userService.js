import Schedule from "../models/Schedule.js";
import ShareCode from "../models/ShareCode.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { deleteUserAvatar } from "./avatarService.js";
import { deleteUserLectures } from "./lectureService.js";
import { deleteUserSessions } from "./sessionService.js";

const PROFILE_FIELDS = ["name", "email", "rollNumber", "section"];

export async function updateProfile(user, changes) {
  if (changes.email && changes.email !== user.email) {
    const taken = await User.exists({ email: changes.email, _id: { $ne: user._id } });
    if (taken) {
      throw new AppError("An account with this email already exists.", 409, {
        code: "EMAIL_TAKEN",
        details: { email: "An account with this email already exists." },
      });
    }
  }

  PROFILE_FIELDS.forEach((field) => {
    if (changes[field] !== undefined) user[field] = changes[field];
  });
  await user.save();
  return user;
}

export async function deleteAccount(user) {
  await Promise.all([
    Schedule.deleteOne({ user: user._id }),
    ShareCode.deleteMany({ owner: user._id }),
    deleteUserSessions(user._id),
    deleteUserLectures(user._id),
    deleteUserAvatar(user),
  ]);
  await user.deleteOne();
}
