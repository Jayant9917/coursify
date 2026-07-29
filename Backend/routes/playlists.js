const { Router } = require("express");
const validate = require("../middlewares/validate");
const { requireAuth } = require("../middlewares/auth");
const { playlistController } = require("../controllers");
const { playlistImportSchema, playlistIdSchema, playlistProgressSchema, playlistListSchema } = require("../validators");

const router = Router();

router.post("/import", requireAuth, validate(playlistImportSchema), playlistController.import);
router.get("/me", requireAuth, validate(playlistListSchema, "query"), playlistController.me);
router.get("/:id", requireAuth, validate(playlistIdSchema, "params"), playlistController.getById);
router.get("/:id/watch", requireAuth, validate(playlistIdSchema, "params"), playlistController.watch);
router.patch("/:id/progress", requireAuth, validate(playlistIdSchema, "params"), validate(playlistProgressSchema), playlistController.progress);
router.post("/:id/refresh", requireAuth, validate(playlistIdSchema, "params"), playlistController.refresh);

module.exports = router;
