const { Router } = require("express");
const { enrollmentController } = require("../controllers");
const validate = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { enrollmentSchema, progressSchema, lessonNoteSchema, bookmarkSchema, quizSubmissionSchema, assignmentSubmissionSchema } = require("../validators");

const router = Router();

router.post("/", requireAuth, requireRole("student"), validate(enrollmentSchema), enrollmentController.create);
router.get("/me", requireAuth, requireRole("student"), enrollmentController.me);
router.patch("/progress", requireAuth, requireRole("student"), validate(progressSchema), enrollmentController.progress);
router.post("/bookmarks", requireAuth, requireRole("student"), validate(bookmarkSchema), enrollmentController.bookmark);
router.get("/bookmarks", requireAuth, requireRole("student"), enrollmentController.bookmarks);
router.put("/notes", requireAuth, requireRole("student"), validate(lessonNoteSchema), enrollmentController.saveNote);
router.get("/notes", requireAuth, requireRole("student"), enrollmentController.notes);
router.post("/quiz", requireAuth, requireRole("student"), validate(quizSubmissionSchema), enrollmentController.quiz);
router.post("/assignments", requireAuth, requireRole("student"), validate(assignmentSubmissionSchema), enrollmentController.assignment);
router.post("/certificates/:courseId", requireAuth, requireRole("student"), enrollmentController.certificate);
router.get("/certificates", requireAuth, requireRole("student"), enrollmentController.certificates);

module.exports = router;
