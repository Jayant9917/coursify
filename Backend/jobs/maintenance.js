const config = require("../config");
const { log } = require("../utils/logger");
const { expirePendingOrders, releaseExpiredCouponReservations, reconcilePaidOrders } = require("../services");
const uploadService = require("../services/upload");

let timer = null;
let running = false;

const runCouponCleanup = async () => {
  if (running) return;
  running = true;
  try {
    const [released, expired, reconciled, mediaCleaned, staleLocalUploads] = await Promise.all([
      releaseExpiredCouponReservations(),
      expirePendingOrders(),
      reconcilePaidOrders(),
      config.mediaStorageProvider === "s3" ? uploadService.cleanupExpiredS3MultipartUploads() : Promise.resolve(0),
      uploadService.cleanupStaleLocalUploads(),
    ]);
    if (released > 0 || expired > 0 || reconciled.failed > 0 || mediaCleaned > 0 || staleLocalUploads > 0) {
      log("info", "maintenance.cleanup_completed", { releasedCouponReservations: released, expiredOrders: expired, reconciliation: reconciled, mediaCleaned, staleLocalUploads });
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
