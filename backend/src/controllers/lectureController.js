import * as lectureService from "../services/lectureService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listLectures = asyncHandler(async (req, res) => {
  res.json({ lectures: await lectureService.listCourseLectures(req.user._id, req.query.course) });
});

export const getLecture = asyncHandler(async (req, res) => {
  res.json({ lecture: await lectureService.getLecture(req.user._id, req.params.lectureId) });
});

export const updateLecture = asyncHandler(async (req, res) => {
  res.json({ lecture: await lectureService.saveLecture(req.user._id, req.params.lectureId, req.body) });
});

export const uploadLectureFile = asyncHandler(async (req, res) => {
  const lecture = await lectureService.addFile(req.user._id, req.params.lectureId, req.body, req.file);
  res.status(201).json({ lecture });
});

export const downloadLectureFile = asyncHandler(async (req, res) => {
  const { meta, stream } = await lectureService.openFile(req.user._id, req.params.lectureId, req.params.fileId);
  res.setHeader("Content-Type", meta.mimeType || "application/octet-stream");
  res.setHeader("Content-Length", meta.size);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${meta.name.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(meta.name)}`
  );
  res.setHeader("Cache-Control", "private, no-store");
  stream.on("error", () => res.destroy());
  stream.pipe(res);
});

export const deleteLectureFile = asyncHandler(async (req, res) => {
  res.json({ lecture: await lectureService.deleteFile(req.user._id, req.params.lectureId, req.params.fileId) });
});
