require("dotenv").config();

const required = [
  "LEMONSQUEEZY_API_KEY",
  "LEMONSQUEEZY_STORE_ID",
  "LEMONSQUEEZY_VARIANT_ID",
  "LEMONSQUEEZY_WEBHOOK_SECRET",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing Lemon Squeezy variables: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  const headers = {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
  };

  const check = async (label, url) => {
    const response = await fetch(url, { headers });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`${label} check failed (${response.status}): ${body?.errors?.[0]?.detail || "unknown error"}`);
    console.log(`${label}: OK`);
  };

  (async () => {
    try {
      await check("Store", `https://api.lemonsqueezy.com/v1/stores/${encodeURIComponent(process.env.LEMONSQUEEZY_STORE_ID)}`);
      await check("Variant", `https://api.lemonsqueezy.com/v1/variants/${encodeURIComponent(process.env.LEMONSQUEEZY_VARIANT_ID)}`);
      console.log("Webhook secret: configured");
      console.log("No payment was created by this check.");
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  })();
}
