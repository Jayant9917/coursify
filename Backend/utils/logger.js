const crypto = require("crypto");
const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            singleLine: true,
            messageFormat: "{event} {method} {url} {statusCode} {durationMs}ms",
          },
        }
      : undefined,
});

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "oldpassword",
  "old_password",
  "newpassword",
  "new_password",
  "confirmpassword",
  "confirm_password",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "token",
  "secret",
  "apikey",
  "api_key",
  "webhooksecret",
  "webhook_secret",
  "authorization",
  "cookie",
  "signature",
  "x-signature",
  "rawbody",
  "raw_body",
  "dataurl",
  "data_url",
]);

const MAX_STRING_LENGTH = 4000;

const createRequestId = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
};

const sanitize = (value, key = "", depth = 0) => {
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) return "[redacted]";
  if (value === null || value === undefined) return value;
  if (depth > 5) return "[truncated]";
  if (Buffer.isBuffer(value)) return "[buffer redacted]";

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]` : value;
  }

  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitize(item, "", depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 100)
      .map(([entryKey, entryValue]) => [entryKey, sanitize(entryValue, entryKey, depth + 1)])
  );
};

const log = (level, event, details = {}) => {
  const safeDetails = sanitize(details);
  const write = typeof logger[level] === "function" ? logger[level].bind(logger) : logger.info.bind(logger);
  write({ event, ...safeDetails }, event);
};

module.exports = { createRequestId, sanitize, log };
