const { AuditLog } = require("../models");
const { log } = require("./logger");

const recordAudit = async ({ actor, action, resourceType, resourceId, metadata = {}, request } = {}) => {
  try {
    return await AuditLog.create({
      actorId: actor?.id || actor?._id || null,
      actorRole: actor?.role || "system",
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : "",
      metadata,
      requestId: request?.requestId || "",
      ip: request?.ip || request?.socket?.remoteAddress || "",
      userAgent: request?.get?.("user-agent") || "",
    });
  } catch (error) {
    log("error", "audit.write_failed", { action, resourceType, resourceId, error });
    return null;
  }
};

module.exports = { recordAudit };
