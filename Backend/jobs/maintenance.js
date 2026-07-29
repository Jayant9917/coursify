const config = require("../config");
const { log } = require("../utils/logger");
const { expirePendingOrders, releaseExpiredCouponReservations } = require("../services");

let timer = null;
let running = false;

const runCouponCleanup = async () => {
  if (running) return;
  running = true;
  try {
    const [released, expired] = await Promise.all([
      releaseExpiredCouponReservations(),
      expirePendingOrders(),
    ]);
    if (released > 0 || expired > 0) {
      log("info", "payment.cleanup_completed", { releasedCouponReservations: released, expiredOrders: expired });
    }
  } catch (error) {
    log("error", "coupon.cleanup_failed", {
      error: { name: error?.name, message: error?.message, stack: error?.stack },
    });
  } finally {
    running = false;
  }
};

const startMaintenanceJobs = () => {
  if (timer) return () => clearInterval(timer);

  const intervalMs = Math.max(Number(config.couponCleanupIntervalMs) || 60000, 10000);
  timer = setInterval(runCouponCleanup, intervalMs);
  timer.unref?.();
  runCouponCleanup();

  log("info", "maintenance.started", { couponCleanupIntervalMs: intervalMs });
  return () => {
    clearInterval(timer);
    timer = null;
  };
};

module.exports = { startMaintenanceJobs, runCouponCleanup };
