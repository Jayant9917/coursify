const crypto = require("crypto");
const config = require("../config");
const ApiError = require("./apiError");

const getLemonSqueezyConfig = () => {
  const { lemonSqueezyApiKey, lemonSqueezyStoreId, lemonSqueezyVariantId, lemonSqueezyWebhookSecret, frontendUrl } = config;

  if (!lemonSqueezyApiKey || !lemonSqueezyStoreId || !lemonSqueezyVariantId) {
    throw new ApiError(503, "Lemon Squeezy is not configured");
  }

  return {
    apiKey: lemonSqueezyApiKey,
    storeId: lemonSqueezyStoreId,
    variantId: lemonSqueezyVariantId,
    webhookSecret: lemonSqueezyWebhookSecret,
    frontendUrl: frontendUrl || "",
  };
};

const normalizeMoneyAmount = (amount) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ApiError(400, "Invalid payment amount");
  }

  return Math.round(numeric);
};

const createCheckout = async ({
  amount,
  currency,
  orderId,
  userId,
  userEmail,
  courseIds = [],
  noteIds = [],
  resourceType = "course",
  couponCode = "",
  redirectPath = "/student/dashboard",
  expiresAt = null,
}) => {
  const { apiKey, storeId, variantId, frontendUrl } = getLemonSqueezyConfig();
  const customPrice = normalizeMoneyAmount(amount);

  const productOptions = {};
  if (frontendUrl) {
    productOptions.redirect_url = `${frontendUrl.replace(/\/$/, "")}${redirectPath}?payment=success&orderId=${orderId}`;
  }

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        custom_price: customPrice,
        checkout_data: {
          ...(userEmail ? { email: userEmail } : {}),
          custom: {
            order_id: String(orderId),
            user_id: String(userId),
            resource_type: resourceType,
            course_ids: JSON.stringify(courseIds),
            note_ids: JSON.stringify(noteIds),
            currency: currency || "INR",
            ...(couponCode ? { coupon_code: String(couponCode) } : {}),
          },
        },
        ...(expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : {}),
        ...(Object.keys(productOptions).length ? { product_options: productOptions } : {}),
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: String(storeId),
          },
        },
        variant: {
          data: {
            type: "variants",
            id: String(variantId),
          },
        },
      },
    },
  };

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(502, payload?.errors?.[0]?.detail || payload?.message || "Lemon Squeezy checkout creation failed");
  }

  return {
    checkoutId: payload?.data?.id || "",
    checkoutUrl: payload?.data?.attributes?.url || "",
    raw: payload,
  };
};

const verifyWebhookSignature = ({ rawBody, signature }) => {
  const { webhookSecret } = getLemonSqueezyConfig();
  if (!webhookSecret) {
    throw new ApiError(503, "Lemon Squeezy webhook signing secret is not configured");
  }

  if (!rawBody || !signature) {
    throw new ApiError(400, "Missing webhook signature");
  }

  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody);
  const expected = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex").toLowerCase();
  const normalizedSignature = String(signature).trim().replace(/^sha256=/i, "").toLowerCase();
  const digest = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(normalizedSignature, "utf8");

  if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
    throw new ApiError(401, "Invalid Lemon Squeezy webhook signature");
  }

  return true;
};

const parseWebhookBody = (body) => {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Invalid webhook payload");
  }

  const eventName = body?.meta?.event_name || body?.meta?.eventName || "";
  const customData = body?.meta?.custom_data || body?.meta?.customData || {};
  const payload = body?.data || body;

  return {
    eventName,
    customData,
    payload,
  };
};

module.exports = {
  createCheckout,
  parseWebhookBody,
  verifyWebhookSignature,
};
