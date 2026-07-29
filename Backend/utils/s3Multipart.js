const {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  S3Client,
} = require("@aws-sdk/client-s3");
const { UploadPartCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const ApiError = require("./apiError");
const config = require("../config");
const { buildObjectKey, getS3Env, validateFileUpload } = require("./s3");

const clients = new Map();

const getClient = () => {
  const { accessKeyId, secretAccessKey, region } = getS3Env();
  const cacheKey = `${accessKeyId}:${region}`;
  if (!clients.has(cacheKey)) {
    clients.set(cacheKey, new S3Client({ region, credentials: { accessKeyId, secretAccessKey } }));
  }
  return clients.get(cacheKey);
};

const getBucket = () => getS3Env().bucket;

const assertPartNumber = (partNumber) => {
  const value = Number(partNumber);
  if (!Number.isInteger(value) || value < 1 || value > 10000) {
    throw new ApiError(400, "Invalid S3 multipart part number");
  }
  return value;
};

const assertParts = (parts) => {
  if (!Array.isArray(parts) || parts.length === 0) throw new ApiError(400, "Multipart upload parts are required");
  const normalized = parts.map((part) => ({
    PartNumber: assertPartNumber(part?.partNumber ?? part?.PartNumber),
    ETag: String(part?.etag ?? part?.ETag ?? "").trim(),
  }));
  if (normalized.some((part) => !part.ETag)) throw new ApiError(400, "Every uploaded part must include its ETag");
  normalized.sort((left, right) => left.PartNumber - right.PartNumber);
  return normalized;
};

const initiateMultipartUpload = async ({ fileName, contentType, folder }) => {
  const normalizedFolder = validateFileUpload({ folder, contentType });
  const key = buildObjectKey(normalizedFolder, fileName);
  const command = new CreateMultipartUploadCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });
  const response = await getClient().send(command);
  if (!response.UploadId) throw new ApiError(502, "S3 did not return a multipart upload ID");
  return {
    provider: "s3",
    folder: normalizedFolder,
    key,
    uploadId: response.UploadId,
    partSize: config.s3MultipartPartBytes,
    expiresInSeconds: config.s3PresignExpiresSeconds,
  };
};

const createMultipartPartUrl = async ({ key, uploadId, partNumber }) => {
  const normalizedPartNumber = assertPartNumber(partNumber);
  if (!key || !uploadId) throw new ApiError(400, "S3 multipart key and upload ID are required");
  const command = new UploadPartCommand({
    Bucket: getBucket(),
    Key: key,
    UploadId: uploadId,
    PartNumber: normalizedPartNumber,
  });
  return {
    uploadUrl: await getSignedUrl(getClient(), command, { expiresIn: config.s3PresignExpiresSeconds }),
    partNumber: normalizedPartNumber,
    expiresInSeconds: config.s3PresignExpiresSeconds,
  };
};

const completeMultipartUpload = async ({ key, uploadId, parts }) => {
  const normalizedParts = assertParts(parts);
  const command = new CompleteMultipartUploadCommand({
    Bucket: getBucket(),
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: normalizedParts },
  });
  const response = await getClient().send(command);
  return { provider: "s3", key, fileKey: key, fileUrl: response.Location || "" };
};

const abortMultipartUpload = async ({ key, uploadId }) => {
  if (!key || !uploadId) throw new ApiError(400, "S3 multipart key and upload ID are required");
  await getClient().send(new AbortMultipartUploadCommand({ Bucket: getBucket(), Key: key, UploadId: uploadId }));
  return { provider: "s3", key, uploadId, aborted: true };
};

const listMultipartParts = async ({ key, uploadId }) => {
  if (!key || !uploadId) throw new ApiError(400, "S3 multipart key and upload ID are required");
  const response = await getClient().send(new ListPartsCommand({ Bucket: getBucket(), Key: key, UploadId: uploadId }));
  return (response.Parts || []).map((part) => ({ partNumber: part.PartNumber, etag: part.ETag, size: part.Size }));
};

module.exports = {
  initiateMultipartUpload,
  createMultipartPartUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  listMultipartParts,
};
