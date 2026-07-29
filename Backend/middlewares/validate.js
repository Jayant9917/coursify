const ApiError = require("../utils/apiError");

const validate = (schema, property = "body") => (req, res, next) => {
  const result = schema.safeParse(req[property]);
  if (!result.success) {
    return next(new ApiError(400, "Validation failed", result.error.issues || result.error.errors || []));
  }

  req[property] = result.data;
  return next();
};

module.exports = validate;
