const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = ["MONGODB_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "PORT"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

const config = {
  port: Number(process.env.PORT),
  mongoUrl: process.env.MONGODB_URL,
  testMongoUrl: process.env.TEST_MONGODB_URL || "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenTtl: "15m",
  refreshTokenTtl: "7d",
  couponReservationTtlMinutes: Number(process.env.COUPON_RESERVATION_TTL_MINUTES || 30),
  bcryptSaltRounds: 12,
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL || "",
  youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
  lemonSqueezyApiKey: process.env.LEMONSQUEEZY_API_KEY || "",
  lemonSqueezyStoreId: process.env.LEMONSQUEEZY_STORE_ID || "",
  lemonSqueezyProductId: process.env.LEMONSQUEEZY_PRODUCT_ID || "",
  lemonSqueezyVariantId: process.env.LEMONSQUEEZY_VARIANT_ID || "",
  lemonSqueezyWebhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "",
  lemonSqueezyAmountToleranceMinor: Number(process.env.LEMONSQUEEZY_AMOUNT_TOLERANCE_MINOR || 100),
  couponCleanupIntervalMs: Number(process.env.COUPON_CLEANUP_INTERVAL_MS || 60000),
  redisUrl: process.env.REDIS_URL || "",
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 30),
  metricsEnabled: process.env.METRICS_ENABLED !== "false",
  metricsToken: process.env.METRICS_TOKEN || "",
  queueEnabled: process.env.QUEUE_ENABLED === "true",
};

module.exports = config;
