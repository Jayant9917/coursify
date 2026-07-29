const test = require("node:test");
const assert = require("node:assert/strict");
const { orderSchema } = require("../../validators");

const validId = "507f1f77bcf86cd799439011";

test("order validation accepts a paid Study Vault note checkout", () => {
  const result = orderSchema.parse({ noteIds: [validId], currency: "INR" });
  assert.deepEqual(result.noteIds, [validId]);
  assert.equal(result.courseIds, undefined);
});

test("order validation rejects mixed course and note checkout items", () => {
  assert.throws(
    () => orderSchema.parse({ courseIds: [validId], noteIds: [validId] }),
    /Provide either courseIds or noteIds/
  );
});
