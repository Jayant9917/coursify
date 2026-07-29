const crypto = require("crypto");
const ApiError = require("./apiError");

const getS3Env = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;

  if (!accessKeyId || !secretAccessKey || !region || !bucket) {
    throw new ApiError(500, "S3 is not configured");
  }

  return { accessKeyId, secretAccessKey, region, bucket };
};

const ALLOWED_CONTENT_TYPES = {
  lessonVideos: new Set(["video/mp4", "video/webm", "video/quicktime", "video/mpeg"]),
  lessonPdfs: new Set(["application/pdf"]),
  notes: new Set(["application/pdf"]),
};

const inferFileFolder = (contentType) => {
  const normalized = String(contentType || "").toLowerCase();
  if (ALLOWED_CONTENT_TYPES.lessonPdfs.has(normalized)) return "lessonPdfs";
  if (normalized.startsWith("video/")) return "lessonVideos";
  throw new ApiError(400, "Only PDF and video files are supported");
};

const validateFileUpload = ({ folder, contentType }) => {
  const normalizedFolder = folder || inferFileFolder(contentType);
  const allowed = ALLOWED_CONTENT_TYPES[normalizedFolder];
  if (!allowed) {
    throw new ApiError(400, "Invalid upload folder");
  }
  if (!allowed.has(String(contentType || "").toLowerCase())) {
    throw new ApiError(400, "Unsupported file type for this folder");
  }
  return normalizedFolder;
};

const safeFileName = (fileName) =>
  String(fileName || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const buildObjectKey = (folder, fileName) => {
  const prefix = folder === "lessonPdfs" ? "lesson-pdfs" : folder === "notes" ? "notes" : "lesson-videos";
  const stamp = Date.now();
  const random = crypto.randomBytes(6).toString("hex");
  return `${prefix}/${stamp}-${random}-${safeFileName(fileName)}`;
};

const encodeRfc3986 = (value) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

const encodePath = (path) =>
  path
    .split("/")
    .map((part) => encodeRfc3986(part))
    .join("/");

const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();
const sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");

const toAmzDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const getSigningKey = (secretKey, dateStamp, region) => {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
};

const createPresignedUrl = ({ method, key, expiresInSeconds = 900 }) => {
  const { accessKeyId, secretAccessKey, region, bucket } = getS3Env();
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const canonicalUri = `/${encodePath(key)}`;
  const canonicalQuery = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", encodeRfc3986(`${accessKeyId}/${scope}`)],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresInSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ]
    .map(([name, value]) => `${name}=${value}`)
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";
  const canonicalRequest = [method.toUpperCase(), canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const signature = crypto
    .createHmac("sha256", getSigningKey(secretAccessKey, dateStamp, region))
    .update(stringToSign)
    .digest("hex");

  const signedUrl = `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  return {
    signedUrl,
    uploadUrl: signedUrl,
    fileUrl: `https://${host}${canonicalUri}`,
    expiresInSeconds,
    key,
  };
};

const createPresignedPutUrl = ({ key, expiresInSeconds = 900 }) =>
  createPresignedUrl({ method: "PUT", key, expiresInSeconds });

const createPresignedGetUrl = ({ key, expiresInSeconds = 300 }) =>
  createPresignedUrl({ method: "GET", key, expiresInSeconds });

module.exports = {
  getS3Env,
  ALLOWED_CONTENT_TYPES,
  inferFileFolder,
  validateFileUpload,
  buildObjectKey,
  createPresignedPutUrl,
  createPresignedGetUrl,
};
