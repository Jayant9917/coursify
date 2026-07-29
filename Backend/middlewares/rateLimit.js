const ApiError = require("../utils/apiError");
const { runWithRedis } = require("../utils/redis");

const localBuckets = new Map();
let lastLocalCleanup = 0;

const getClientKey = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) return String(forwardedFor).split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
};

const consumeLocal = (key, windowMs, max) => {
  const now = Date.now();
  if (now - lastLocalCleanup > windowMs) {
    for (const [bucketKey, bucket] of localBuckets) {
      if (bucket.resetAt <= now) localBuckets.delete(bucketKey);
    }
    lastLocalCleanup = now;
  }

  const bucket = localBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (bucket.count >= max) return { allowed: false, remaining: 0 };
  bucket.count += 1;
  return { allowed: true, remaining: Math.max(0, max - bucket.count) };
};

const consumeRedis = async (key, windowMs, max) => runWithRedis(async (redis) => {
  const redisKey = `rate-limit:${key}`;
  const result = await redis.multi().incr(redisKey).pexpire(redisKey, windowMs).exec();
  const count = Number(result?.[0]?.[1] || 0);
  return { allowed: count <= max, remaining: Math.max(0, max - count) };
});

const rateLimit = ({ windowMs = 60_000, max = 10, message = "Too many requests, please try again later." } = {}) => {
  return async (req, res, next) => {
    const routeKey = req.baseUrl && req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path || req.originalUrl.split("?")[0];
    const key = `${getClientKey(req)}:${routeKey}`;
    const result = (await consumeRedis(key, windowMs, max)) || consumeLocal(key, windowMs, max);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    if (!result.allowed) return next(new ApiError(429, message));
    return next();
  };
};

module.exports = rateLimit;
