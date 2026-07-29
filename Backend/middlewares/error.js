const ApiError = require("../utils/apiError");
const { sanitize, log } = require("../utils/logger");

const notFound = (req, res, next) => {
  next(new ApiError(404, "The requested endpoint was not found."));
};

const normalizeErrors = (errors) => {
  if (!errors) return [];
  if (Array.isArray(errors)) return errors;
  return Object.values(errors).flatMap((value) => (Array.isArray(value) ? value : [value]));
};

const fieldLabel = (path) =>
  String(path || "")
    .split(".")
    .filter(Boolean)
    .map((part) => part.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()))
    .join(" ");

const formatValidationIssue = (issue) => {
  if (typeof issue === "string") return issue;

  const field = fieldLabel(Array.isArray(issue?.path) ? issue.path.join(".") : issue?.path);
  const prefix = field ? `${field}: ` : "";

  if (issue?.code === "too_small" && issue?.type === "string") {
    return `${field || "This field"} must be at least ${issue.minimum} characters.`;
  }

  if (issue?.code === "too_big" && issue?.type === "string") {
    return `${field || "This field"} must be no more than ${issue.maximum} characters.`;
  }

  if (issue?.code === "invalid_string" && issue?.validation === "email") {
    return `${field || "Email"} must be a valid email address.`;
  }

  if (issue?.code === "invalid_type" && issue?.received === "undefined") {
    return `${field || "This field"} is required.`;
  }

  if (issue?.code === "unrecognized_keys") {
    return "The request contains unsupported fields.";
  }

  return `${prefix}${issue?.message || issue?.msg || issue?.reason || "Please check this field."}`;
};

const publicValidationErrors = (errors) =>
  errors.map((item) => {
    if (typeof item === "string") return { message: item };

    const result = { message: formatValidationIssue(item) };
    if (item?.code) result.code = item.code;
    if (Array.isArray(item?.path)) result.path = item.path;
    if (typeof item?.minimum === "number") result.minimum = item.minimum;
    if (typeof item?.maximum === "number") result.maximum = item.maximum;
    return result;
  });

const statusForError = (error) => {
  if (error instanceof ApiError && Number.isInteger(error.statusCode)) return error.statusCode;
  if (error?.name === "ValidationError" || error?.name === "CastError") return 400;
  if (error?.code === 11000) return 409;
  if (["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"].includes(error?.name)) return 401;
  if (error?.type === "entity.parse.failed") return 400;
  return 500;
};

const defaultMessageForStatus = (statusCode) => {
  if (statusCode === 400) return "The request could not be processed. Please check your information.";
  if (statusCode === 401) return "Your session is invalid or has expired. Please sign in again.";
  if (statusCode === 403) return "You do not have permission to perform this action.";
  if (statusCode === 404) return "The requested resource was not found.";
  if (statusCode === 409) return "This action conflicts with existing data.";
  if (statusCode === 429) return "Too many attempts. Please wait a moment and try again.";
  if (statusCode === 502) return "The external service could not complete the request. Please try again.";
  if (statusCode === 503) return "This service is temporarily unavailable. Please try again later.";
  if (statusCode === 504) return "The request took too long. Please try again.";
  return "Something went wrong on our side. Please try again.";
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const statusCode = statusForError(error);
  const normalizedErrors = normalizeErrors(error?.errors || (error?.name === "ValidationError" ? error.errors : undefined));
  const safeErrors = normalizedErrors.length ? publicValidationErrors(normalizedErrors) : [];
  const validationMessage = safeErrors[0]?.message;
  const isValidationError = error?.name === "ValidationError" || error?.message === "Validation failed";
  const clientMessage =
    statusCode >= 500
      ? defaultMessageForStatus(statusCode)
      : isValidationError
        ? validationMessage || defaultMessageForStatus(statusCode)
        : error?.message || defaultMessageForStatus(statusCode);

  const diagnosticErrors = normalizedErrors.map((item) => {
    if (typeof item === "string") return item;
    return {
      name: item?.name,
      code: item?.code,
      path: item?.path,
      kind: item?.kind,
      message: item?.message || item?.msg || item?.reason,
    };
  });

  log("error", "api.error", {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    route: req.route?.path || "unmatched",
    statusCode,
    user: req.user ? { id: req.user.id, role: req.user.role } : null,
    request: {
      query: sanitize(req.query),
      params: sanitize(req.params),
      body: sanitize(req.body),
    },
    response: {
      statusCode,
      message: clientMessage,
      errors: safeErrors.length ? safeErrors : undefined,
    },
    error: {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      details: diagnosticErrors.length ? diagnosticErrors : undefined,
    },
  });

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(safeErrors.length ? { errors: safeErrors } : {}),
  });
};

module.exports = { notFound, errorHandler };
