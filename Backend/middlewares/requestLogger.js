const { createRequestId, sanitize, log } = require("../utils/logger");

const WEBHOOK_PATH = "/api/orders/webhook/lemon-squeezy";

const getRouteName = (req) => {
  if (!req.route?.path) return "unmatched";
  return `${req.baseUrl || ""}${req.route.path}`;
};

const getUserContext = (req) => {
  if (!req.user) return null;
  return {
    id: req.user.id,
    role: req.user.role,
  };
};

const getWebhookContext = (req) => {
  const body = req.body || {};
  const payload = body.data || body;
  const customData =
    body.meta?.custom_data ||
    body.meta?.customData ||
    payload.attributes?.custom_data ||
    payload.attributes?.customData ||
    {};

  return {
    eventName: body.meta?.event_name || body.meta?.eventName || "unknown",
    orderId: customData.order_id || customData.orderId || "unknown",
    providerStatus: payload.attributes?.status || "unknown",
  };
};

const getRequestContext = (req) => ({
  requestId: req.requestId,
  method: req.method,
  url: req.originalUrl,
  route: getRouteName(req),
  ip: req.ip || req.socket?.remoteAddress || "unknown",
  userAgent: req.get("user-agent") || "unknown",
  user: getUserContext(req),
  query: sanitize(req.query),
  params: sanitize(req.params),
  body: sanitize(req.body),
});

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  const requestId = createRequestId();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  log("info", "api.request", {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket?.remoteAddress || "unknown",
    userAgent: req.get("user-agent") || "unknown",
  });

  res.on("finish", () => {
    const context = getRequestContext(req);
    const response = {
      ...context,
      statusCode: res.statusCode,
      statusClass: `${Math.floor(res.statusCode / 100)}xx`,
      durationMs: Date.now() - startedAt,
      responseLength: res.get("content-length") || null,
    };

    if (req.originalUrl?.split("?")[0] === WEBHOOK_PATH) {
      Object.assign(response, getWebhookContext(req), {
        webhookResponseStatus: res.statusCode,
      });
    }

    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    log(level, "api.response", response);
  });

  next();
};

module.exports = requestLogger;
