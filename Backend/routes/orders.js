const { Router } = require("express");
const { orderController } = require("../controllers");
const validate = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { orderSchema } = require("../validators");

const router = Router();

router.post("/webhook/lemon-squeezy", orderController.lemonSqueezyWebhook);
router.post("/", requireAuth, requireRole("student"), validate(orderSchema), orderController.create);
router.get("/me", requireAuth, requireRole("student"), orderController.me);
router.get("/:id/status", requireAuth, requireRole("student"), orderController.status);
router.get("/webhook-monitoring", requireAuth, requireRole("admin"), orderController.webhookMonitoring);
router.post("/webhook-monitoring/:id/replay", requireAuth, requireRole("admin"), orderController.replayWebhook);
router.get("/", requireAuth, requireRole("admin"), orderController.list);
router.get("/:id", requireAuth, requireRole("admin"), orderController.adminDetails);
router.post("/:id/refund", requireAuth, requireRole("admin"), orderController.adminRefund);

module.exports = router;
