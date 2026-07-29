const crypto = require("crypto");
const ApiError = require("./apiError");

const getCloudinaryEnv = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(500, "Cloudinary is not configured");
  }

  return { cloudName, apiKey, apiSecret };
};

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const buildSignature = (params, apiSecret) => {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  const payload = entries.map(([key, value]) => `${key}=${value}`).join("&");
  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
};

const uploadImage = async ({ dataUrl, folder, publicId }) => {
  if (typeof dataUrl !== "string") {
    throw new ApiError(400, "Only image data URLs are supported");
  }

  const match = dataUrl.match(/^data:([^;]+);base64,/i);
  const mimeType = match?.[1]?.toLowerCase();
  if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new ApiError(400, "Only png, jpeg, webp, gif, and avif images are allowed");
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp, folder, public_id: publicId };
  const signature = buildSignature(params, apiSecret);
  const form = new FormData();

  form.append("file", dataUrl);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  if (folder) {
    form.append("folder", folder);
  }

  if (publicId) {
    form.append("public_id", publicId);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      502,
      payload?.error?.message || "Cloudinary upload failed"
    );
  }

  return {
    url: payload.secure_url,
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    assetId: payload.asset_id,
    format: payload.format,
    width: payload.width,
    height: payload.height,
    bytes: payload.bytes,
    originalFilename: payload.original_filename,
  };
};

module.exports = {
  uploadImage,
  buildSignature,
};
