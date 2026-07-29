const { Router } = require("express");
const validate = require("../middlewares/validate");
const { requireAuth } = require("../middlewares/auth");
const { uploadController } = require("../controllers");
const { uploadImageSchema, uploadPublicImageSchema, uploadLessonFileSchema } = require("../validators");
const multer = require("multer");
const os = require("os");
const path = require("path");
const config = require("../config");

const localUpload = multer({
  dest: path.join(os.tmpdir(), "skillnest-uploads"),
  limits: { fileSize: config.localUploadMaxBytes },
  fileFilter: (req, file, callback) => {
    const allowed = file.mimetype === "application/pdf" || file.mimetype.startsWith("video/");
    callback(allowed ? null : new Error("Only PDF and video files are supported"), allowed);
  },
});
const localChunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.localUploadChunkBytes },
});

const router = Router();

router.post("/image", requireAuth, validate(uploadImageSchema), uploadController.image);
router.get("/config", requireAuth, uploadController.config);
router.post("/public-image", validate(uploadPublicImageSchema), uploadController.publicImage);
router.post("/lesson-file", requireAuth, validate(uploadLessonFileSchema), uploadController.lessonFile);
router.post("/local-file", requireAuth, localUpload.single("file"), uploadController.localFile);
router.post("/s3-multipart/initiate", requireAuth, uploadController.s3MultipartInitiate);
router.get("/s3-multipart/:uploadId", requireAuth, uploadController.s3MultipartStatus);
router.post("/s3-multipart/:uploadId/part-url", requireAuth, uploadController.s3MultipartPartUrl);
router.post("/s3-multipart/:uploadId/complete", requireAuth, uploadController.s3MultipartComplete);
router.delete("/s3-multipart/:uploadId", requireAuth, uploadController.s3MultipartAbort);
router.post("/local-video", requireAuth, uploadController.localVideoStart);
router.get("/local-video/:uploadId", requireAuth, uploadController.localVideoStatus);
router.patch("/local-video/:uploadId/chunk", requireAuth, localChunkUpload.single("chunk"), uploadController.localVideoChunk);
router.post("/local-video/:uploadId/complete", requireAuth, uploadController.localVideoComplete);
router.delete("/local-video/:uploadId", requireAuth, uploadController.localVideoCancel);

module.exports = router;
