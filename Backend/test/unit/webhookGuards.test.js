const crypto = require("node:crypto");
const test = require("node:test");
const assert = require("node:assert/strict");
const config = require("../../config");
const { orderService } = require("../../services");

const original = {
  apiKey: config.lemonSqueezyApiKey,
  storeId: config.lemonSqueezyStoreId,
  variantId: config.lemonSqueezyVariantId,
  secret: config.lemonSqueezyWebhookSecret,
};

const body = { meta: { event_name: "order_created" }, data: { attributes: {} } };
const rawBody = JSON.stringify(body);

const sign = (value) => crypto.createHmac("sha256", "test-webhook-secret").update(value).digest("hex");

test.before(() => {
  config.lemonSqueezyApiKey = "test-api-key";
  config.lemonSqueezyStoreId = "430439";
  config.lemonSqueezyVariantId = "1918421";
  config.lemonSqueezyWebhookSecret = "test-webhook-secret";
});

test.after(() => {
  config.lemonSqueezyApiKey = original.apiKey;
  config.lemonSqueezyStoreId = original.storeId;
  config.lemonSqueezyVariantId = original.variantId;
  config.lemonSqueezyWebhookSecret = original.secret;
});

test("rejects a webhook with an invalid signature", async () => {
  await assert.rejects(
    orderService.handleLemonSqueezyWebhook({ rawBody, signature: "invalid", body }),
    (error) => error.statusCode === 401 && /signature/i.test(error.message)
  );
});

test("rejects a signed webhook without local order metadata", async () => {
  await assert.rejects(
    orderService.handleLemonSqueezyWebhook({ rawBody, signature: sign(rawBody), body }),
    (error) => error.statusCode === 400 && /order metadata/i.test(error.message)
  );
});
