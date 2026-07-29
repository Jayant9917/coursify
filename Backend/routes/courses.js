const { Router } = require("express");
const { courseController, sectionController, lessonController, reviewController, enrollmentController } = require("../controllers");
const validate = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const {
  courseSchema,
  courseUpdateSchema,
  publishSchema,
  sectionSchema,
  lessonSchema,
  reviewSchema,
  lessonAccessSchema,
} = require("../validators");

const router = Router();

router.get("/", courseController.listPublic);
router.post("/", requireAuth, requireRole("instructor", "admin"), validate(courseSchema), courseController.create);
router.get("/admin/all", requireAuth, requireRole("admin"), courseController.adminList);
router.get("/instructor/me", requireAuth, requireRole("instructor", "admin"), courseController.instructorCourses);

router.post("/:id/sections", requireAuth, requireRole("instructor", "admin"), validate(sectionSchema), sectionController.create);
router.put("/sections/:id", requireAuth, requireRole("instructor", "admin"), validate(sectionSchema), sectionController.update);
router.delete("/sections/:id", requireAuth, requireRole("instructor", "admin"), sectionController.delete);

router.post("/sections/:id/lessons", requireAuth, requireRole("instructor", "admin"), validate(lessonSchema), lessonController.create);
router.put("/lessons/:id", requireAuth, requireRole("instructor", "admin"), validate(lessonSchema.partial()), lessonController.update);
router.delete("/lessons/:id", requireAuth, requireRole("instructor", "admin"), lessonController.delete);

router.get("/:id/progress", requireAuth, enrollmentController.courseProgress);
router.get(
  "/:id/lessons/:lessonId/access",
  requireAuth,
  validate(lessonAccessSchema, "params"),
  courseController.lessonAccess
);
router.post("/:id/reviews", requireAuth, requireRole("student"), validate(reviewSchema), reviewController.create);
router.get("/:id/reviews", reviewController.list);

router.put("/:id", requireAuth, requireRole("instructor", "admin"), validate(courseUpdateSchema), courseController.update);
router.patch("/:id/publish", requireAuth, requireRole("instructor", "admin"), validate(publishSchema), courseController.publish);
router.delete("/:id", requireAuth, requireRole("admin"), courseController.delete);

router.get("/:slug", courseController.getPublicBySlug);

module.exports = router;
