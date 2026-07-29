class ApiError extends Error {
  constructor(statusCode, message, errors = [], code = "") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.name = "ApiError";
  }
}

module.exports = ApiError;
