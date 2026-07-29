const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
const path = require("path");

const config = require("./config");
const { notFound, errorHandler } = require("./middlewares/error");
const securityHeaders = require("./middlewares/security");
const requestLogger = require("./middlewares/requestLogger");
const { log } = require("./utils/logger");
const { startMaintenanceJobs } = require("./jobs/maintenance");
const { startQueueWorkers } = require("./jobs/queue");
const { requestMetrics, metricsHandler } = require("./utils/metrics");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const courseRoutes = require("./routes/courses");
const enrollmentRoutes = require("./routes/enrollments");
const orderRoutes = require("./routes/orders");
const socialRoutes = require("./routes/social");
const dashboardRoutes = require("./routes/dashboards");
const uploadRoutes = require("./routes/uploads");
const platformRoutes = require("./routes/platform");
const playlistRoutes = require("./routes/playlists");
const noteRoutes = require("./routes/notes");
const auditRoutes = require("./routes/audit");

const app = express();

app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      if (!config.corsOrigins.length && process.env.NODE_ENV !== "production") return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(securityHeaders);
app.use(compression());
app.use(requestMetrics);
app.use(requestLogger);
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Skillnest API is running",
  });
});

app.get("/health/live", (req, res) => res.json({ success: true, status: "ok" }));
app.get("/health/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({ success: ready, status: ready ? "ready" : "not_ready" });
});
app.get("/metrics", metricsHandler);
// Local-development delivery only. Replace with protected provider playback before production.
app.use("/uploads/videos", express.static(path.join(__dirname, "uploads", "videos")));
app.use("/uploads/media", express.static(config.localMediaRoot));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", socialRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin/audit-logs", auditRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await mongoose.connect(config.mongoUrl);
    const queueStarted = await startQueueWorkers();
    if (!queueStarted) startMaintenanceJobs();
    app.listen(config.port, () => {
      log("info", "server.started", { port: config.port });
    });
  } catch (error) {
    log("error", "server.startup_error", {
      error: { name: error?.name, message: error?.message, stack: error?.stack },
    });
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = { app, start };
