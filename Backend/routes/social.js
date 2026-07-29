const { Router } = require("express");
const { reviewController, wishlistController, categoryController, couponController, notificationController } = require("../controllers");
const validate = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { categorySchema, couponSchema, couponValidateSchema } = require("../validators");

const router = Router();

router.delete("/reviews/:id", requireAuth, reviewController.delete);

router.post("/wishlist/:courseId", requireAuth, requireRole("student"), wishlistController.add);
router.delete("/wishlist/:courseId", requireAuth, requireRole("student"), wishlistController.remove);
router.get("/wishlist", requireAuth, requireRole("student"), wishlistController.list);

router.get("/categories", categoryController.list);
router.post("/categories", requireAuth, requireRole("admin"), validate(categorySchema), categoryController.create);
router.put("/categories/:id", requireAuth, requireRole("admin"), validate(categorySchema.partial()), categoryController.update);
router.delete("/categories/:id", requireAuth, requireRole("admin"), categoryController.delete);

router.post("/coupons", requireAuth, requireRole("admin"), validate(couponSchema), couponController.create);
router.get("/coupons", requireAuth, requireRole("admin"), couponController.list);
router.put("/coupons/:id", requireAuth, requireRole("admin"), validate(couponSchema.partial()), couponController.update);
router.delete("/coupons/:id", requireAuth, requireRole("admin"), couponController.delete);
router.post("/coupons/validate", requireAuth, requireRole("student"), validate(couponValidateSchema), couponController.validate);

router.get("/notifications", requireAuth, notificationController.list);
router.patch("/notifications/:id/read", requireAuth, notificationController.markRead);
router.patch("/notifications/read-all", requireAuth, notificationController.markAllRead);

module.exports = router;
