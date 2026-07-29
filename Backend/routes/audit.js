const { Router } = require("express");
const { auditController } = require("../controllers");
const { requireAuth, requireRole } = require("../middlewares/auth");

const router = Router();

router.get("/", requireAuth, requireRole("admin"), auditController.list);

module.exports = router;
