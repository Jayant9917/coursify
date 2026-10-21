const client = require("prom-client");
const config = require("../config");

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

const requestCount = new client.Counter({
  name: "coursify_http_requests_total",
  help: "Total HTTP requests handled by the API",
  labelNames: ["method", "route", "status"],
  registers: [registry],
});

const requestDuration = new client.Histogram({
  name: "coursify_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

const paymentEvents = new client.Counter({
  name: "coursify_payment_events_total",
  help: "Payment state transitions and notifications processed",
  labelNames: ["event"],
  registers: [registry],
});

const paymentEvent = (event) => paymentEvents.inc({ event: String(event || "unknown").slice(0, 60) });

const requestMetrics = (req, res, next) => {
  if (!config.metricsEnabled) return next();
  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const route = req.route?.path ? `${req.baseUrl || ""}${req.route.path}` : req.path || "unknown";
    const status = String(res.statusCode);
    const labels = { method: req.method, route, status };
    requestCount.inc(labels);
    requestDuration.observe(labels, Number(process.hrtime.bigint() - startedAt) / 1e9);
  });
  next();
};

const metricsHandler = async (req, res) => {
  if (config.metricsToken && req.get("x-metrics-token") !== config.metricsToken) {
    return res.status(401).json({ success: false, message: "Metrics authentication failed" });
  }
  res.set("Content-Type", registry.contentType);
  return res.end(await registry.metrics());
};

module.exports = { requestMetrics, metricsHandler, registry, paymentEvent };
