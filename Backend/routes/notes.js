const { Router } = require("express");
const { noteController } = require("../controllers");
const validate = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { noteCreateSchema, noteUpdateSchema } = require("../validators");

const router = Router();

router.get("/", noteController.listPublic);
router.get("/instructor/me", requireAuth, requireRole("instructor", "admin"), noteController.listMine);
router.get("/purchases/me", requireAuth, requireRole("student"), noteController.myPurchases);
router.post("/", requireAuth, requireRole("instructor", "admin"), validate(noteCreateSchema), noteController.create);
router.put("/:id", requireAuth, requireRole("instructor", "admin"), validate(noteUpdateSchema), noteController.update);
router.delete("/:id", requireAuth, requireRole("instructor", "admin"), noteController.remove);
router.post("/:id/purchase", requireAuth, requireRole("student"), noteController.purchase);
router.get("/:id/download", requireAuth, noteController.download);
router.get("/:slug", noteController.getPublicBySlug);

module.exports = router;
