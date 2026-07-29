const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const ApiError = require("./apiError");

const MAX_VIDEO_BYTES = Math.max(1, Number(process.env.LOCAL_UPLOAD_MAX_MB || 200)) * 1024 * 1024;
const MAX_CHUNK_BYTES = Math.max(1, Number(process.env.LOCAL_UPLOAD_CHUNK_MB || 8)) * 1024 * 1024;
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/mpeg"]);
const uploadRoot = path.resolve(process.env.LOCAL_VIDEO_UPLOAD_DIR || path.join(__dirname, "..", "uploads"));
const tempRoot = path.join(uploadRoot, ".chunks");
const videoRoot = path.join(uploadRoot, "videos");

const ensureDirectories = async () => {
  await Promise.all([fs.promises.mkdir(tempRoot, { recursive: true }), fs.promises.mkdir(videoRoot, { recursive: true })]);
};
const metadataPath = (uploadId) => path.join(tempRoot, `${uploadId}.json`);
const partPath = (uploadId) => path.join(tempRoot, `${uploadId}.part`);
const safeFileName = (fileName) => {
  const value = String(fileName || "video.mp4").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return value || "video.mp4";
};
const readMetadata = async (uploadId) => {
  if (!/^[a-f0-9-]{36}$/i.test(String(uploadId))) throw new ApiError(400, "Invalid upload ID");
  try {
    return JSON.parse(await fs.promises.readFile(metadataPath(uploadId), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") throw new ApiError(404, "Local video upload was not found");
    throw error;
  }
};
const assertOwner = (metadata, actor) => {
  if (metadata.ownerId !== String(actor?.id) && actor?.role !== "admin") throw new ApiError(403, "You cannot access this upload");
};
const validateVideo = ({ fileName, contentType, size }) => {
  if (!VIDEO_TYPES.has(String(contentType || "").toLowerCase())) throw new ApiError(400, "Only MP4, WebM, MOV, and MPEG videos are supported");
  if (!Number.isInteger(Number(size)) || Number(size) <= 0 || Number(size) > MAX_VIDEO_BYTES) throw new ApiError(400, "Local development videos must be between 1 byte and 200 MB");
  return safeFileName(fileName);
};

const startUpload = async (actor, payload) => {
  const fileName = validateVideo(payload);
  await ensureDirectories();
  const uploadId = crypto.randomUUID();
  const metadata = { uploadId, ownerId: String(actor.id), fileName, contentType: String(payload.contentType).toLowerCase(), size: Number(payload.size), uploadedBytes: 0, createdAt: new Date().toISOString() };
  await fs.promises.writeFile(metadataPath(uploadId), JSON.stringify(metadata, null, 2), "utf8");
  await fs.promises.writeFile(partPath(uploadId), Buffer.alloc(0));
  return metadata;
};
const getStatus = async (actor, uploadId) => {
  const metadata = await readMetadata(uploadId);
  assertOwner(metadata, actor);
  return metadata;
};
const writeChunk = async (actor, uploadId, offset, chunk) => {
  const metadata = await readMetadata(uploadId);
  assertOwner(metadata, actor);
  if (!Buffer.isBuffer(chunk) || chunk.length === 0) throw new ApiError(400, "Upload chunk is empty");
  if (chunk.length > MAX_CHUNK_BYTES) throw new ApiError(400, "Upload chunk is too large");
  if (Number(offset) !== metadata.uploadedBytes) throw new ApiError(409, `Upload offset mismatch. Resume from byte ${metadata.uploadedBytes}.`);
  if (metadata.uploadedBytes + chunk.length > metadata.size) throw new ApiError(400, "Upload exceeds the declared file size");
  const handle = await fs.promises.open(partPath(uploadId), "r+");
  try {
    await handle.write(chunk, 0, chunk.length, metadata.uploadedBytes);
  } finally {
    await handle.close();
  }
  metadata.uploadedBytes += chunk.length;
  await fs.promises.writeFile(metadataPath(uploadId), JSON.stringify(metadata, null, 2), "utf8");
  return metadata;
};
const completeUpload = async (actor, uploadId) => {
  const metadata = await readMetadata(uploadId);
  assertOwner(metadata, actor);
  if (metadata.uploadedBytes !== metadata.size) throw new ApiError(409, `Upload is incomplete. ${metadata.size - metadata.uploadedBytes} bytes remain.`);
  await ensureDirectories();
  const finalName = `${Date.now()}-${uploadId}-${metadata.fileName}`;
  await fs.promises.rename(partPath(uploadId), path.join(videoRoot, finalName));
  await fs.promises.rm(metadataPath(uploadId), { force: true });
  return { uploadId, fileName: metadata.fileName, fileKey: `videos/${finalName}`, fileUrl: `/uploads/videos/${encodeURIComponent(finalName)}`, contentType: metadata.contentType, size: metadata.size };
};
const cancelUpload = async (actor, uploadId) => {
  const metadata = await readMetadata(uploadId);
  assertOwner(metadata, actor);
  await Promise.all([fs.promises.rm(metadataPath(uploadId), { force: true }), fs.promises.rm(partPath(uploadId), { force: true })]);
  return { uploadId, cancelled: true };
};

module.exports = { startUpload, getStatus, writeChunk, completeUpload, cancelUpload };
