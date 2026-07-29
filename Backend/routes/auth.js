const { Router } = require("express");
const validate = require("../middlewares/validate");
const rateLimit = require("../middlewares/rateLimit");
const { authController } = require("../controllers");
const {
  authRegisterSchema,
  authLoginSchema,
  authRefreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators");

const router = Router();

const authWindow = 15 * 60 * 1000;

router.post(
  "/register",
  rateLimit({ windowMs: authWindow, max: 5, message: "Too many registration attempts. Please try again later." }),
  validate(authRegisterSchema),
  authController.register
);
router.post(
  "/login",
  rateLimit({ windowMs: authWindow, max: 8, message: "Too many login attempts. Please try again later." }),
  validate(authLoginSchema),
  authController.login
);
router.post(
  "/forgot-password",
  rateLimit({ windowMs: authWindow, max: 5, message: "Too many reset attempts. Please try again later." }),
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
router.post("/refresh", validate(authRefreshSchema), authController.refresh);
router.post("/logout", validate(authRefreshSchema), authController.logout);

module.exports = router;
