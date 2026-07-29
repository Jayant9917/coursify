const crypto = require("crypto");
const { PasswordResetToken } = require("../models");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createResetToken = async ({ token, userId, email, expiresAt }) => {
  const tokenHash = hashToken(token);
  await PasswordResetToken.findOneAndUpdate(
    { tokenHash },
    {
      tokenHash,
      userId,
      email,
      expiresAt,
      usedAt: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getResetToken = async (token) => {
  const tokenHash = hashToken(token);
  return PasswordResetToken.findOne({ tokenHash });
};

const markResetTokenUsed = async (token) => {
  const tokenHash = hashToken(token);
  return PasswordResetToken.findOneAndUpdate(
    { tokenHash },
    { usedAt: new Date() },
    { new: true }
  );
};

const deleteResetTokensByUserId = async (userId) => {
  return PasswordResetToken.deleteMany({ userId });
};

module.exports = {
  hashToken,
  createResetToken,
  getResetToken,
  markResetTokenUsed,
  deleteResetTokensByUserId,
};
