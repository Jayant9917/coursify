const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { RefreshToken } = require("../models");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== "object" || !decoded.exp) {
    throw new Error("Unable to determine refresh token expiry");
  }

  return new Date(decoded.exp * 1000);
};

const setRefreshToken = async (token, payload) => {
  const tokenHash = hashToken(token);
  const expiresAt = getTokenExpiry(token);

  await RefreshToken.findOneAndUpdate(
    { tokenHash },
    {
      tokenHash,
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
      expiresAt,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  return RefreshToken.findOne({ tokenHash });
};

const deleteRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  return RefreshToken.deleteOne({ tokenHash });
};

const deleteTokensByUserId = async (userId) => {
  return RefreshToken.deleteMany({ userId });
};

module.exports = {
  hashToken,
  setRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  deleteTokensByUserId,
};
