const { Router } = require("express");
const validate = require("../middlewares/validate");
const { requireAuth } = require("../middlewares/auth");
const { uploadController } = require("../controllers");
const { uploadImageSchema, uploadPublicImageSchema, uploadLessonFileSchema } = require("../validators");

const router = Router();

router.post("/image", requireAuth, validate(uploadImageSchema), uploadController.image);
router.post("/public-image", validate(uploadPublicImageSchema), uploadController.publicImage);
router.post("/lesson-file", requireAuth, validate(uploadLessonFileSchema), uploadController.lessonFile);

module.exports = router;
