const test = require("node:test");
const assert = require("node:assert/strict");
const config = require("../../config");
const { reconcileLemonSqueezyOrder } = require("../../services");

const originalConfig = {
  storeId: config.lemonSqueezyStoreId,
  productId: config.lemonSqueezyProductId,
  variantId: config.lemonSqueezyVariantId,
  tolerance: config.lemonSqueezyAmountToleranceMinor,
};

const basePayload = () => ({
  id: "9006785",
  attributes: {
    store_id: "430439",
    currency: "INR",
    total: 99944,
    first_order_item: { product_id: "1227022", variant_id: "1918421" },
  },
});

test.beforeEach(() => {
  config.lemonSqueezyStoreId = "430439";
  config.lemonSqueezyProductId = "1227022";
  config.lemonSqueezyVariantId = "1918421";
  config.lemonSqueezyAmountToleranceMinor = 100;
});

test.after(() => {
  config.lemonSqueezyStoreId = originalConfig.storeId;
  config.lemonSqueezyProductId = originalConfig.productId;
  config.lemonSqueezyVariantId = originalConfig.variantId;
  config.lemonSqueezyAmountToleranceMinor = originalConfig.tolerance;
});

test("accepts a matching paid Lemon Squeezy order", () => {
  const result = reconcileLemonSqueezyOrder({ amount: 999, currency: "INR" }, basePayload());
  assert.equal(result.providerOrderId, "9006785");
});

test("rejects a webhook from the wrong store", () => {
  const payload = basePayload();
  payload.attributes.store_id = "different-store";
  assert.throws(() => reconcileLemonSqueezyOrder({ amount: 999, currency: "INR" }, payload), /store does not match/i);
});

test("rejects a webhook with an amount mismatch", () => {
  const payload = basePayload();
  payload.attributes.total = 100100;
  assert.throws(() => reconcileLemonSqueezyOrder({ amount: 999, currency: "INR" }, payload), /amount does not match/i);
});

test("rejects a webhook with the wrong currency", () => {
  const payload = basePayload();
  payload.attributes.currency = "USD";
  assert.throws(() => reconcileLemonSqueezyOrder({ amount: 999, currency: "INR" }, payload), /currency does not match/i);
});
