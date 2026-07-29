const ApiError = require("../utils/apiError");
const { uploadImage: cloudinaryUploadImage } = require("../utils/cloudinary");
const {
  buildObjectKey,
  createPresignedPutUrl,
  validateFileUpload,
} = require("../utils/s3");

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

const uploadService = {
  async uploadImage(actor, payload) {
    const folder = normalizeFolder(payload.folder);
    assertFolderPermission(actor, folder);

    const result = await cloudinaryUploadImage({
      dataUrl: payload.dataUrl,
      folder,
      publicId: payload.publicId || undefined,
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

  async requestLessonFileUpload(actor, payload) {
    const folder = validateFileUpload({
      folder: payload.folder,
      contentType: payload.contentType,
    });
    assertFolderPermission(actor, folder);

    const key = buildObjectKey(folder, payload.fileName);
    const presigned = createPresignedPutUrl({ key });

    return {
      provider: "s3",
      folder,
      fileKey: key,
      ...presigned,
    };
  },
};

module.exports = uploadService;
