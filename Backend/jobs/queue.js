const { Queue, Worker } = require("bullmq");
const Redis = require("ioredis");
const config = require("../config");
const { log } = require("../utils/logger");
const { releaseExpiredCouponReservations } = require("../services");

const QUEUE_NAME = "coursify-maintenance";
let queue;
let worker;
let connection;

const startQueueWorkers = async () => {
  if (!config.queueEnabled || !config.redisUrl) return false;

  connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
  queue = new Queue(QUEUE_NAME, { connection });
  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== "coupon-cleanup") return;
      const released = await releaseExpiredCouponReservations();
      if (released > 0) log("info", "coupon.cleanup_completed", { released, source: "queue" });
    },
    { connection }
  );
  worker.on("failed", (job, error) => log("error", "queue.job_failed", {
    queue: QUEUE_NAME,
    job: job?.name,
    error: { name: error?.name, message: error?.message },
  }));
  worker.on("error", (error) => log("error", "queue.worker_error", {
    error: { name: error?.name, message: error?.message },
  }));

  await queue.add("coupon-cleanup", {}, {
    jobId: "coupon-cleanup",
    repeat: { every: Math.max(Number(config.couponCleanupIntervalMs) || 60000, 10000) },
    removeOnComplete: 100,
    removeOnFail: 100,
  });
  log("info", "queue.started", { queue: QUEUE_NAME });
  return true;
};

const stopQueueWorkers = async () => {
  await worker?.close();
  await queue?.close();
  await connection?.quit();
  worker = null;
  queue = null;
  connection = null;
};

module.exports = { startQueueWorkers, stopQueueWorkers };
