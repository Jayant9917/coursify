const ApiError = require("../utils/apiError");
const { recordAudit } = require("../utils/audit");
const { MediaUpload } = require("../models");
const { uploadImage: cloudinaryUploadImage } = require("../utils/cloudinary");
const {
  buildObjectKey,
  createPresignedPutUrl,
  validateFileUpload,
} = require("../utils/s3");
const {
  initiateMultipartUpload,
  createMultipartPartUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  listMultipartParts,
} = require("../utils/s3Multipart");
const localVideoUpload = require("../utils/localVideoUpload");
const config = require("../config");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ALLOWED_FOLDERS = {
  avatars: ["student", "instructor", "admin"],
  courseThumbnails: ["instructor", "admin"],
  lessonVideos: ["instructor", "admin"],
  lessonPdfs: ["instructor", "admin"],
  notes: ["instructor", "admin"],
};

const normalizeFolder = (folder) => {
  if (!folder) return "avatars";
  const value = String(folder).trim();
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_FOLDERS, value)) {
    throw new ApiError(400, "Invalid upload folder");
  }
  return value;
};

const assertFolderPermission = (actor, folder) => {
  const allowedRoles = ALLOWED_FOLDERS[folder] || [];
  if (!allowedRoles.includes(actor?.role)) {
    throw new ApiError(403, "You do not have permission to upload to this folder");
  }
};

const localFolderName = (folder) => (folder === "lessonPdfs" ? "lesson-pdfs" : "lesson-videos");

const completeLocalFileUpload = async (actor, file, folder, request) => {
  if (!file) throw new ApiError(400, "No file was uploaded");
  const normalizedFolder = validateFileUpload({ folder, contentType: file.mimetype });
  assertFolderPermission(actor, normalizedFolder);

  const directory = path.join(config.localMediaRoot, localFolderName(normalizedFolder));
  await fs.promises.mkdir(directory, { recursive: true });
  const extension = path.extname(file.originalname || "").toLowerCase();
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
  const destination = path.join(directory, fileName);
  await fs.promises.rename(file.path, destination);

  const folderName = localFolderName(normalizedFolder);
  const fileKey = `${folderName}/${fileName}`;
  const fileUrl = `/uploads/media/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`;
  await recordAudit({
    actor,
    action: "upload.local_file_completed",
    resourceType: "upload",
    resourceId: fileKey,
    metadata: { folder: normalizedFolder, contentType: file.mimetype, size: file.size },
    request,
  });

  return { provider: "local", folder: normalizedFolder, fileKey, fileUrl, contentType: file.mimetype, size: file.size };
};

const assertMediaUploadOwner = (upload, actor) => {
  if (!upload || (String(upload.userId) !== String(actor?.id) && actor?.role !== "admin")) {
    throw new ApiError(403, "You cannot access this upload");
  }
  if (upload.status !== "initiated") throw new ApiError(409, "This upload is no longer active");
};

const uploadService = {
  getConfig() {
    return { provider: config.mediaStorageProvider, maxUploadBytes: config.localUploadMaxBytes };
  },
  async uploadImage(actor, payload, request) {
    const folder = normalizeFolder(payload.folder);
    assertFolderPermission(actor, folder);

    const result = await cloudinaryUploadImage({
      dataUrl: payload.dataUrl,
      folder,
      publicId: payload.publicId || undefined,
    });

    await recordAudit({
      actor,
      action: "upload.image_completed",
      resourceType: "upload",
      resourceId: result.publicId || result.url,
      metadata: { folder, provider: "cloudinary" },
      request,
    });

    return {
      folder,
      ...result,
    };
  },

  async uploadPublicAvatar(payload) {
    const result = await cloudinaryUploadImage({
      dataUrl: payload.dataUrl,
      folder: "avatars",
      publicId: payload.publicId || undefined,
    });

    return {
      folder: "avatars",
      ...result,
    };
  },

  async requestLessonFileUpload(actor, payload, request) {
    const folder = validateFileUpload({
      folder: payload.folder,
      contentType: payload.contentType,
    });
    assertFolderPermission(actor, folder);

    const key = buildObjectKey(folder, payload.fileName);
    const presigned = createPresignedPutUrl({ key });

    await recordAudit({
      actor,
      action: "upload.file_presigned",
      resourceType: "upload",
      resourceId: key,
      metadata: { folder, contentType: payload.contentType, fileName: payload.fileName },
      request,
    });

    return {
      provider: "s3",
      folder,
      fileKey: key,
      ...presigned,
    };
  },

  async initiateS3Multipart(actor, payload, request) {
    const folder = validateFileUpload(payload);
    assertFolderPermission(actor, folder);
    const upload = await initiateMultipartUpload({ ...payload, folder });
    await MediaUpload.create({
      userId: actor.id,
      provider: "s3",
      uploadId: upload.uploadId,
      key: upload.key,
      folder,
      contentType: payload.contentType,
      expiresAt: new Date(Date.now() + config.s3MultipartSessionTtlHours * 60 * 60 * 1000),
    });
    await recordAudit({ actor, action: "upload.s3_multipart_started", resourceType: "upload", resourceId: upload.key, metadata: { uploadId: upload.uploadId, folder }, request });
    return upload;
  },

  async getS3MultipartPartUrl(actor, uploadId, partNumber) {
    const upload = await MediaUpload.findOne({ uploadId });
    assertMediaUploadOwner(upload, actor);
    return createMultipartPartUrl({ key: upload.key, uploadId, partNumber });
  },

  async getS3MultipartStatus(actor, uploadId) {
    const upload = await MediaUpload.findOne({ uploadId });
    assertMediaUploadOwner(upload, actor);
    const parts = await listMultipartParts({ key: upload.key, uploadId });
    return { provider: "s3", uploadId, key: upload.key, folder: upload.folder, contentType: upload.contentType, status: upload.status, parts };
  },

  async completeS3Multipart(actor, uploadId, parts, request) {
    const upload = await MediaUpload.findOne({ uploadId });
    assertMediaUploadOwner(upload, actor);
    const result = await completeMultipartUpload({ key: upload.key, uploadId, parts });
    upload.status = "completed";
    await upload.save();
    await recordAudit({ actor, action: "upload.s3_multipart_completed", resourceType: "upload", resourceId: upload.key, metadata: { uploadId, parts: parts.length }, request });
    return result;
  },

  async abortS3Multipart(actor, uploadId, request) {
    const upload = await MediaUpload.findOne({ uploadId });
    assertMediaUploadOwner(upload, actor);
    const result = await abortMultipartUpload({ key: upload.key, uploadId });
    upload.status = "aborted";
    await upload.save();
    await recordAudit({ actor, action: "upload.s3_multipart_aborted", resourceType: "upload", resourceId: upload.key, metadata: { uploadId }, request });
    return result;
  },

  async startLocalVideoUpload(actor, payload, request) {
    const upload = await localVideoUpload.startUpload(actor, payload);
    await recordAudit({ actor, action: "upload.local_video_started", resourceType: "upload", resourceId: upload.uploadId, metadata: { fileName: upload.fileName, contentType: upload.contentType, size: upload.size }, request });
    return upload;
  },
  async localVideoUploadStatus(actor, uploadId) {
    return localVideoUpload.getStatus(actor, uploadId);
  },
  async writeLocalVideoChunk(actor, uploadId, offset, chunk) {
    return localVideoUpload.writeChunk(actor, uploadId, offset, chunk);
  },
  async completeLocalVideoUpload(actor, uploadId, request) {
    const result = await localVideoUpload.completeUpload(actor, uploadId);
    await recordAudit({ actor, action: "upload.local_video_completed", resourceType: "upload", resourceId: uploadId, metadata: { fileKey: result.fileKey, fileName: result.fileName, size: result.size }, request });
    return result;
  },
  async cancelLocalVideoUpload(actor, uploadId, request) {
    const result = await localVideoUpload.cancelUpload(actor, uploadId);
    await recordAudit({ actor, action: "upload.local_video_cancelled", resourceType: "upload", resourceId: uploadId, request });
    return result;
  },
  completeLocalFileUpload,
};

module.exports = uploadService;
