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
  emailProvider: process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? "resend" : "console"),
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFromNoReply: process.env.EMAIL_FROM_NO_REPLY || "Skillnest <no-reply@skillnest.com>",
  emailFromSecurity: process.env.EMAIL_FROM_SECURITY || "Skillnest Security <security@skillnest.com>",
  emailFromNotifications: process.env.EMAIL_FROM_NOTIFICATIONS || "Skillnest <notifications@skillnest.com>",
  emailReplyTo: process.env.EMAIL_REPLY_TO || "support@skillnest.com",
  emailLogoUrl: process.env.EMAIL_LOGO_URL || "",
  youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
  lemonSqueezyApiKey: process.env.LEMONSQUEEZY_API_KEY || "",
  lemonSqueezyStoreId: process.env.LEMONSQUEEZY_STORE_ID || "",
  lemonSqueezyProductId: process.env.LEMONSQUEEZY_PRODUCT_ID || "",
  lemonSqueezyVariantId: process.env.LEMONSQUEEZY_VARIANT_ID || "",
  lemonSqueezyWebhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "",
  lemonSqueezyAmountToleranceMinor: Number(process.env.LEMONSQUEEZY_AMOUNT_TOLERANCE_MINOR || 100),
  lemonSqueezyCheckoutTtlMinutes: Math.max(1, Number(process.env.LEMONSQUEEZY_CHECKOUT_TTL_MINUTES || 5)),
  couponCleanupIntervalMs: Number(process.env.COUPON_CLEANUP_INTERVAL_MS || 60000),
  redisUrl: process.env.REDIS_URL || "",
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 30),
  metricsEnabled: process.env.METRICS_ENABLED !== "false",
  metricsToken: process.env.METRICS_TOKEN || "",
  queueEnabled: process.env.QUEUE_ENABLED === "true",
  mediaStorageProvider: process.env.MEDIA_STORAGE_PROVIDER || "s3",
  localMediaRoot: process.env.LOCAL_MEDIA_ROOT || require("path").join(__dirname, "uploads", "media"),
  localUploadMaxBytes: Math.max(1, Number(process.env.LOCAL_UPLOAD_MAX_MB || 200)) * 1024 * 1024,
  localUploadChunkBytes: Math.max(1, Number(process.env.LOCAL_UPLOAD_CHUNK_MB || 8)) * 1024 * 1024,
  s3MultipartPartBytes: Math.max(5, Number(process.env.S3_MULTIPART_PART_MB || 8)) * 1024 * 1024,
  s3PresignExpiresSeconds: Math.min(3600, Math.max(60, Number(process.env.S3_PRESIGN_EXPIRES_SECONDS || 900))),
  s3MultipartSessionTtlHours: Math.max(1, Number(process.env.S3_MULTIPART_SESSION_TTL_HOURS || 24)),
};

if (!["s3", "local"].includes(config.mediaStorageProvider)) {
  throw new Error("MEDIA_STORAGE_PROVIDER must be either s3 or local");
}

if (!["resend", "console"].includes(config.emailProvider)) {
  throw new Error("EMAIL_PROVIDER must be either resend or console");
}

if (process.env.NODE_ENV === "production" && config.emailProvider !== "resend") {
  throw new Error("EMAIL_PROVIDER=resend is required in production");
}

if (config.emailProvider === "resend" && !config.resendApiKey) {
  throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
}

module.exports = config;
