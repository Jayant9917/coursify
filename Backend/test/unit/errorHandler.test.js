const test = require("node:test");
const assert = require("node:assert/strict");
const ApiError = require("../../utils/apiError");
const { errorHandler } = require("../../middlewares/error");

test("central error handler exposes a safe readable API error", () => {
  let statusCode;
  let body;
  const response = {
    headersSent: false,
    status(status) {
      statusCode = status;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };

  errorHandler(new ApiError(403, "You must be enrolled to access this lesson."), { method: "GET", originalUrl: "/api/lessons/1" }, response, () => {});

  assert.equal(statusCode, 403);
  assert.deepEqual(body, {
    success: false,
    message: "You must be enrolled to access this lesson.",
  });
});

test("central error handler hides internal server details", () => {
  let statusCode;
  let body;
  const response = {
    headersSent: false,
    status(status) {
      statusCode = status;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };

  errorHandler(new Error("MongoServerError: connection details"), { method: "POST", originalUrl: "/api/orders" }, response, () => {});

  assert.equal(statusCode, 500);
  assert.equal(body.success, false);
  assert.equal(body.message, "Something went wrong on our side. Please try again.");
  assert.doesNotMatch(body.message, /MongoServerError/);
});
