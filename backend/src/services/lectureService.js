import { Readable } from "node:stream";
import mongoose from "mongoose";
import LectureNote from "../models/LectureNote.js";
import AppError from "../utils/AppError.js";

const BUCKET_NAME = "lectureFiles";
const MAX_FILES_PER_LECTURE = 20;
const USER_QUOTA_BYTES = 200 * 1024 * 1024;
const NOTE_PREVIEW_LENGTH = 140;

function bucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
}

function toObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError("File not found.", 404, { code: "FILE_NOT_FOUND" });
  return new mongoose.Types.ObjectId(id);
}

function emptyLecture(lectureId) {
  return { lectureId, notes: "", links: [], files: [], updatedAt: null };
}

export function safeFileName(name) {
  const cleaned = String(name || "file")
    .normalize("NFC")
    .replace(/[\\/\u0000-\u001f"]/g, "")
    .trim();
  return (cleaned || "file").slice(0, 200);
}

export async function getLecture(userId, lectureId) {
  const lecture = await LectureNote.findOne({ user: userId, lectureId });
  return lecture ? lecture.toJSON() : emptyLecture(lectureId);
}

export async function saveLecture(userId, lectureId, { courseCode, courseName, date, start, notes, links }) {
  const lecture = await LectureNote.findOneAndUpdate(
    { user: userId, lectureId },
    {
      $set: {
        courseCode,
        courseName,
        date,
        ...(start && { start }),
        ...(notes !== undefined && { notes }),
        ...(links !== undefined && { links }),
      },
      $setOnInsert: { user: userId, lectureId },
    },
    { new: true, upsert: true, runValidators: true }
  );
  return lecture.toJSON();
}

export async function listCourseLectures(userId, courseCode) {
  const lectures = await LectureNote.find({ user: userId, courseCode: courseCode.toUpperCase() })
    .sort({ date: -1, start: -1 })
    .limit(200);

  return lectures
    .map((lecture) => lecture.toJSON())
    .filter((lecture) => lecture.notes.trim() || lecture.links.length > 0 || lecture.files.length > 0)
    .map((lecture) => ({
      lectureId: lecture.lectureId,
      date: lecture.date,
      start: lecture.start,
      notesPreview: lecture.notes.trim().slice(0, NOTE_PREVIEW_LENGTH),
      notes: lecture.notes,
      links: lecture.links,
      files: lecture.files,
      updatedAt: lecture.updatedAt,
    }));
}

async function usedBytes(userId) {
  const [result] = await LectureNote.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(String(userId)) } },
    { $unwind: "$files" },
    { $group: { _id: null, total: { $sum: "$files.size" } } },
  ]);
  return result?.total || 0;
}

function uploadToBucket(buffer, { name, mimeType, userId, lectureId }) {
  return new Promise((resolve, reject) => {
    const stream = bucket().openUploadStream(name, {
      contentType: mimeType,
      metadata: { user: String(userId), lectureId },
    });
    Readable.from(buffer).pipe(stream).on("error", reject).on("finish", () => resolve(stream.id));
  });
}

export async function addFile(userId, lectureId, lectureInfo, file) {
  const existing = await LectureNote.findOne({ user: userId, lectureId });
  if (existing && existing.files.length >= MAX_FILES_PER_LECTURE) {
    throw new AppError(`A lecture can have at most ${MAX_FILES_PER_LECTURE} files.`, 409, { code: "FILE_LIMIT" });
  }
  if ((await usedBytes(userId)) + file.size > USER_QUOTA_BYTES) {
    throw new AppError("You have used your 200 MB of lecture file storage. Delete some files first.", 413, {
      code: "STORAGE_FULL",
    });
  }

  const name = safeFileName(file.originalname);
  const mimeType = String(file.mimetype || "application/octet-stream").slice(0, 120);
  const fileId = await uploadToBucket(file.buffer, { name, mimeType, userId, lectureId });

  try {
    const lecture = await LectureNote.findOneAndUpdate(
      { user: userId, lectureId },
      {
        $set: { courseCode: lectureInfo.courseCode, courseName: lectureInfo.courseName, date: lectureInfo.date },
        $setOnInsert: { user: userId, lectureId, ...(lectureInfo.start && { start: lectureInfo.start }) },
        $push: { files: { fileId, name, size: file.size, mimeType, uploadedAt: new Date() } },
      },
      { new: true, upsert: true, runValidators: true }
    );
    return lecture.toJSON();
  } catch (error) {
    await bucket().delete(fileId).catch(() => {});
    throw error;
  }
}

export async function openFile(userId, lectureId, fileId) {
  const objectId = toObjectId(fileId);
  const lecture = await LectureNote.findOne({ user: userId, lectureId, "files.fileId": objectId });
  const meta = lecture?.files.find((file) => file.fileId.equals(objectId));
  if (!meta) throw new AppError("File not found.", 404, { code: "FILE_NOT_FOUND" });
  return { meta, stream: bucket().openDownloadStream(objectId) };
}

export async function deleteFile(userId, lectureId, fileId) {
  const objectId = toObjectId(fileId);
  const lecture = await LectureNote.findOneAndUpdate(
    { user: userId, lectureId, "files.fileId": objectId },
    { $pull: { files: { fileId: objectId } } },
    { new: true }
  );
  if (!lecture) throw new AppError("File not found.", 404, { code: "FILE_NOT_FOUND" });
  await bucket().delete(objectId).catch(() => {});
  return lecture.toJSON();
}

export async function deleteUserLectures(userId) {
  const lectures = await LectureNote.find({ user: userId }).select("files.fileId");
  const fileIds = lectures.flatMap((lecture) => lecture.files.map((file) => file.fileId));
  await Promise.all(fileIds.map((fileId) => bucket().delete(fileId).catch(() => {})));
  await LectureNote.deleteMany({ user: userId });
}
