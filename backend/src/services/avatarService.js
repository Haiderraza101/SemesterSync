import { Readable } from "node:stream";
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

const BUCKET_NAME = "avatars";

function bucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
}

function toObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(String(id)) : null;
}

async function removeFile(fileId) {
  if (!fileId) return;
  await bucket()
    .delete(toObjectId(fileId))
    .catch(() => {});
}

function upload(buffer, { userId, contentType }) {
  return new Promise((resolve, reject) => {
    const stream = bucket().openUploadStream(`avatar-${userId}`, {
      contentType,
      metadata: { user: String(userId), contentType },
    });
    Readable.from(buffer).pipe(stream).on("error", reject).on("finish", () => resolve(stream.id));
  });
}

export async function setAvatar(user, file) {
  const previous = user.avatarFileId;
  user.avatarFileId = await upload(file.buffer, { userId: user._id, contentType: file.detectedType });
  await user.save();
  await removeFile(previous);
  return user;
}

export async function removeAvatar(user) {
  const previous = user.avatarFileId;
  user.avatarFileId = undefined;
  await user.save();
  await removeFile(previous);
  return user;
}

export async function openAvatar(fileId) {
  const objectId = toObjectId(fileId);
  const [file] = objectId ? await bucket().find({ _id: objectId }).limit(1).toArray() : [];
  if (!file) throw new AppError("Profile picture not found.", 404, { code: "AVATAR_NOT_FOUND" });
  return {
    contentType: file.metadata?.contentType || file.contentType || "application/octet-stream",
    length: file.length,
    stream: bucket().openDownloadStream(objectId),
  };
}

export async function deleteUserAvatar(user) {
  await removeFile(user.avatarFileId);
}
