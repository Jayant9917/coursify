const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const config = require("../config");
const ApiError = require("../utils/apiError");
const { log } = require("../utils/logger");
const slugify = require("../utils/slugify");
const paginate = require("../utils/paginate");
const {
  setRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  deleteTokensByUserId,
} = require("../utils/tokenStore");
const {
  createResetToken,
  getResetToken,
  markResetTokenUsed,
  deleteResetTokensByUserId,
} = require("../utils/passwordResetStore");
const { createPresignedGetUrl } = require("../utils/s3");
const { getOrSetJson } = require("../utils/cache");
const {
  createCheckout: createLemonSqueezyCheckout,
  parseWebhookBody: parseLemonSqueezyWebhookBody,
  verifyWebhookSignature: verifyLemonSqueezyWebhookSignature,
} = require("../utils/lemonSqueezy");
const {
  User,
  Category,
  Course,
  CourseSection,
  Lesson,
  Enrollment,
  Order,
  OrderItem,
  Review,
  Wishlist,
  CourseProgress,
  Coupon,
  Notification,
  WebhookDelivery,
  Note,
  NotePurchase,
} = require("../models");

const runDatabaseTransaction = async (callback) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : user;
  delete plain.passwordHash;
  return plain;
};

const buildTokens = async (user) => {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.accessTokenTtl,
  });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.refreshTokenTtl,
  });

  await setRefreshToken(refreshToken, payload);

  return { accessToken, refreshToken };
};

const buildResetToken = () => crypto.randomBytes(32).toString("hex");

const verifyRefreshToken = async (token) => {
  if (!token || !(await getRefreshToken(token))) {
    throw new ApiError(401, "Refresh token is invalid");
  }

  try {
    return jwt.verify(token, config.jwtRefreshSecret);
  } catch (error) {
    throw new ApiError(401, "Refresh token is invalid or expired");
  }
};

const ensureRoleAllowed = (role) => {
  if (!["student", "instructor", "admin"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }
  if (role === "admin") {
    throw new ApiError(400, "Public registration cannot create admin users");
  }
};

const isOwnerOrAdmin = (actor, ownerId) =>
  actor?.role === "admin" || String(actor?.id) === String(ownerId);

const getCourseByIdentifier = async (identifier, bySlug = false) => {
  const query = bySlug ? { slug: identifier } : { _id: identifier };
  const course = await Course.findOne(query);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }
  return course;
};

const upsertNotification = async ({ userId, type, title, message }) => {
  return Notification.create({ userId, type, title, message });
};

const recalcCourseRatings = async (courseId) => {
  const stats = await Review.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: "$courseId",
        ratingAvg: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const average = Number(stats[0]?.ratingAvg || 0);
  const result = {
    ratingAvg: Number.isFinite(average) ? Math.round(average * 100) / 100 : 0,
    ratingCount: Number(stats[0]?.ratingCount || 0),
  };
  await Course.updateOne(
    { _id: courseId },
    { $set: { ratingAvg: result.ratingAvg, ratingCount: result.ratingCount } }
  );
};

const resolveCoursePrice = (course) =>
  course.discountPrice && course.discountPrice > 0 ? course.discountPrice : course.price;

const hasPaidOrderForCourse = async (userId, courseId) => {
  const paidOrderIds = await Order.distinct("_id", {
    userId,
    status: "paid",
  });

  if (paidOrderIds.length === 0) return false;

  return Boolean(
    await OrderItem.exists({
      orderId: { $in: paidOrderIds },
      courseId,
    })
  );
};

const reconcileLemonSqueezyOrder = (order, payload) => {
  const attributes = payload?.attributes || {};
  const providerOrderId = String(payload?.id || "").trim();
  const providerStoreId = String(
    attributes.store_id || payload?.relationships?.store?.data?.id || ""
  ).trim();
  const firstOrderItem = attributes.first_order_item || {};
  const providerProductId = String(
    firstOrderItem.product_id || payload?.relationships?.product?.data?.id || ""
  ).trim();
  const providerVariantId = String(
    firstOrderItem.variant_id || payload?.relationships?.variant?.data?.id || ""
  ).trim();
  const providerCurrency = String(attributes.currency || "").trim().toUpperCase();
  const providerTotalMinor = Number(attributes.total);
  const localTotalMinor = Math.round(Number(order.amount) * 100);
  const amountToleranceMinor = Math.max(0, Number(config.lemonSqueezyAmountToleranceMinor) || 0);

  if (!providerOrderId) {
    throw new ApiError(400, "Webhook payload is missing the provider order ID");
  }

  if (!providerStoreId || providerStoreId !== String(config.lemonSqueezyStoreId)) {
    throw new ApiError(400, "Webhook store does not match the configured payment store");
  }

  const hasConfiguredProduct = Boolean(config.lemonSqueezyProductId);
  const hasConfiguredVariant = Boolean(config.lemonSqueezyVariantId);
  const productMatches = hasConfiguredProduct && providerProductId === String(config.lemonSqueezyProductId);
  const variantMatches = hasConfiguredVariant && providerVariantId === String(config.lemonSqueezyVariantId);

  if ((!providerProductId && !providerVariantId) || (!productMatches && !variantMatches)) {
    throw new ApiError(400, "Webhook product does not match the configured course product");
  }

  if (!providerCurrency || providerCurrency !== String(order.currency || "").toUpperCase()) {
    throw new ApiError(400, "Webhook currency does not match the local order");
  }

  if (!Number.isFinite(providerTotalMinor) || providerTotalMinor < 0) {
    throw new ApiError(400, "Webhook payload contains an invalid payment amount");
  }

  if (Math.abs(providerTotalMinor - localTotalMinor) > amountToleranceMinor) {
    throw new ApiError(400, "Webhook payment amount does not match the local order");
  }

  return { providerOrderId };
};

const parseBooleanQuery = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === false) return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
};

const getCouponDiscountAmount = (coupon, subtotal = 0) => {
  const normalizedSubtotal = Math.max(0, Number(subtotal) || 0);
  if (coupon.type === "percent") {
    return Math.round((normalizedSubtotal * coupon.value) / 100);
  }

  return Math.min(normalizedSubtotal, coupon.value);
};

const releaseCouponReservation = async (code, session) => {
  if (!code) return;

  await Coupon.updateOne(
    { code: String(code).toUpperCase(), reservedCount: { $gt: 0 } },
    { $inc: { reservedCount: -1 } },
    session ? { session } : undefined
  );
};

const releaseExpiredCouponReservations = async () => {
  const expiredOrders = await Order.find({
    status: "pending",
    couponCode: { $nin: ["", null] },
    couponReservationExpiresAt: { $lte: new Date() },
    $or: [{ couponReservationReleased: false }, { couponReservationReleased: { $exists: false } }],
  })
    .select("_id couponCode")
    .lean();

  const results = await Promise.all(
    expiredOrders.map(async (expiredOrder) => {
      const releasedOrder = await Order.findOneAndUpdate(
        {
          _id: expiredOrder._id,
          status: "pending",
          $or: [{ couponReservationReleased: false }, { couponReservationReleased: { $exists: false } }],
        },
        {
          $set: {
            couponReservationReleased: true,
            couponReservationExpiresAt: null,
          },
        },
        { new: true }
      );

      if (releasedOrder) {
        await releaseCouponReservation(releasedOrder.couponCode);
      }

      return releasedOrder ? 1 : 0;
    })
  );

  return results.filter(Boolean).length;
};

const pickCourseUpdates = (payload) => {
  const updates = {};
  const fields = [
    "title",
    "description",
    "shortDescription",
    "thumbnailUrl",
    "previewVideoUrl",
    "price",
    "discountPrice",
    "level",
    "language",
    "categoryId",
    "tags",
    "isPublished",
    "isFeatured",
  ];

  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  });

  return updates;
};

const pickSectionUpdates = (payload) => {
  const updates = {};
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.order !== undefined) updates.order = payload.order;
  return updates;
};

const pickLessonUpdates = (payload) => {
  const updates = {};
  const fields = ["title", "type", "content", "videoUrl", "fileKey", "fileUrl", "duration", "isPreview", "order"];

  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  });

  return updates;
};

const pickCategoryPayload = (payload) => {
  const picked = {};
  const fields = ["name", "slug", "parentId", "sortOrder", "isActive"];

  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      picked[field] = payload[field];
    }
  });

  return picked;
};

const pickCouponPayload = (payload) => {
  const picked = {};
  const fields = ["code", "type", "value", "maxRedemptions", "expiresAt", "isActive"];

  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      picked[field] = payload[field];
    }
  });

  return picked;
};

const getActiveCouponByCode = async (code) => {
  await releaseExpiredCouponReservations();

  const coupon = await Coupon.findOne({ code: String(code).toUpperCase(), isActive: true });
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(400, "Coupon has expired");
  }
  if ((coupon.redeemedCount || 0) + (coupon.reservedCount || 0) >= coupon.maxRedemptions) {
    throw new ApiError(400, "Coupon redemption limit reached");
  }

  return coupon;
};

const assertCouponNotUsedByUser = async (userId, code) => {
  if (!userId || !code) return;

  const normalizedCode = String(code).toUpperCase();
  const existingRedemption = await Order.findOne({
    userId,
    couponCode: normalizedCode,
    status: { $in: ["paid", "refunded"] },
  })
    .select("_id")
    .lean();

  if (existingRedemption) {
    throw new ApiError(400, "This coupon has already been used on your account");
  }
};

const reserveCoupon = async (code, session) => {
  const coupon = await getActiveCouponByCode(code);
  const reservedCoupon = await Coupon.findOneAndUpdate(
    {
      _id: coupon._id,
      $expr: {
        $lt: [
          { $add: [{ $ifNull: ["$redeemedCount", 0] }, { $ifNull: ["$reservedCount", 0] }] },
          "$maxRedemptions",
        ],
      },
    },
    { $inc: { reservedCount: 1 } },
    { new: true, ...(session ? { session } : {}) }
  );

  if (!reservedCoupon) {
    throw new ApiError(400, "Coupon redemption limit reached");
  }

  return reservedCoupon;
};

const releaseOrderCouponReservation = async (order, session) => {
  if (!order?.couponCode || order.couponRedeemedAt || order.couponReservationReleased) {
    return;
  }

  const releasedOrder = await Order.findOneAndUpdate(
    { _id: order._id, couponReservationReleased: false },
    {
      $set: {
        couponReservationReleased: true,
        couponReservationExpiresAt: null,
      },
    },
    { new: true, ...(session ? { session } : {}) }
  );

  if (releasedOrder) {
    await releaseCouponReservation(releasedOrder.couponCode, session);
  }
};

const finalizeCouponRedemption = async (order, session) => {
  if (!order?.couponCode || order.couponRedeemedAt) return;

  const filter = {
    code: String(order.couponCode).toUpperCase(),
    isActive: true,
    $expr: {
      $lt: [{ $ifNull: ["$redeemedCount", 0] }, "$maxRedemptions"],
    },
  };

  if (!order.couponReservationReleased) {
    filter.reservedCount = { $gt: 0 };
  } else {
    filter.$expr = {
      $lt: [
        { $add: [{ $ifNull: ["$redeemedCount", 0] }, { $ifNull: ["$reservedCount", 0] }] },
        "$maxRedemptions",
      ],
    };
  }

  const coupon = await Coupon.findOneAndUpdate(
    filter,
    [
      {
        $set: {
          redeemedCount: { $add: [{ $ifNull: ["$redeemedCount", 0] }, 1] },
          reservedCount: {
            $max: [0, { $subtract: [{ $ifNull: ["$reservedCount", 0] }, 1] }],
          },
        },
      },
    ],
    { new: true, ...(session ? { session } : {}) }
  );

  if (!coupon) {
    throw new ApiError(409, "Coupon redemption could not be finalized after payment");
  }

  return coupon;
};

const ensureOrderEnrollments = async (order, session) => {
  const orderItemsQuery = OrderItem.find({ orderId: order._id });
  if (session) orderItemsQuery.session(session);
  const orderItems = await orderItemsQuery;

  for (const item of orderItems) {
    if (!item.courseId) continue;
    const enrollmentQuery = Enrollment.findOne({ userId: order.userId, courseId: item.courseId });
    if (session) enrollmentQuery.session(session);
    const existingEnrollment = await enrollmentQuery;
    if (existingEnrollment) {
      if (existingEnrollment.status === "refunded") {
        existingEnrollment.status = existingEnrollment.progressPercent === 100 ? "completed" : "active";
        await existingEnrollment.save(session ? { session } : undefined);
      }
      continue;
    }

    await Enrollment.findOneAndUpdate(
      { userId: order.userId, courseId: item.courseId },
      {
        $setOnInsert: {
          userId: order.userId,
          courseId: item.courseId,
          status: "active",
          progressPercent: 0,
          completedLessonIds: [],
        },
      },
      { new: true, upsert: true, ...(session ? { session } : {}) }
    );

    await Course.updateOne(
      { _id: item.courseId },
      { $inc: { enrollmentCount: 1 } },
      session ? { session } : undefined
    );
  }
};

const revokeOrderEnrollments = async (order, session) => {
  const orderItemsQuery = OrderItem.find({ orderId: order._id }).select("courseId");
  if (session) orderItemsQuery.session(session);
  const orderItems = await orderItemsQuery;
  const courseIds = orderItems.map((item) => item.courseId).filter(Boolean);

  if (courseIds.length === 0) return;

  await Enrollment.updateMany(
    {
      userId: order.userId,
      courseId: { $in: courseIds },
      status: { $in: ["active", "completed"] },
    },
    { $set: { status: "refunded" } },
    session ? { session } : undefined
  );
};

const ensureOrderNotePurchases = async (order, session, providerOrderId = "") => {
  const itemsQuery = OrderItem.find({ orderId: order._id, noteId: { $ne: null } });
  if (session) itemsQuery.session(session);
  const items = await itemsQuery;

  for (const item of items) {
    const existingQuery = NotePurchase.findOne({ userId: order.userId, noteId: item.noteId });
    if (session) existingQuery.session(session);
    const existing = await existingQuery;
    const wasCompleted = existing?.status === "completed";

    await NotePurchase.findOneAndUpdate(
      { userId: order.userId, noteId: item.noteId },
      {
        $set: {
          orderId: order._id,
          providerOrderId: providerOrderId || existing?.providerOrderId || "",
          amount: item.priceAtPurchase,
          currency: order.currency,
          status: "completed",
          purchasedAt: existing?.purchasedAt || new Date(),
        },
      },
      { new: true, upsert: true, ...(session ? { session } : {}) }
    );

    if (!wasCompleted) {
      await Note.updateOne({ _id: item.noteId }, { $inc: { purchaseCount: 1 } }, session ? { session } : undefined);
    }
  }
};

const revokeOrderNotePurchases = async (order, session) => {
  const itemsQuery = OrderItem.find({ orderId: order._id, noteId: { $ne: null } }).select("noteId");
  if (session) itemsQuery.session(session);
  const items = await itemsQuery;
  const noteIds = items.map((item) => item.noteId).filter(Boolean);
  if (noteIds.length === 0) return;

  await NotePurchase.updateMany(
    { userId: order.userId, noteId: { $in: noteIds }, status: "completed" },
    { $set: { status: "refunded" } },
    session ? { session } : undefined
  );
};

const markOrderFailed = async (orderId) => {
  await runDatabaseTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order) return;

    await releaseOrderCouponReservation(order, session);
    await Order.updateOne(
      { _id: order._id, status: "pending" },
      { $set: { status: "failed" } },
      { session }
    );
  });
};

const courseSearchFilter = (query) => {
  const filter = { isPublished: true };

  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.level) filter.level = query.level;
  if (query.instructorId) filter.instructorId = query.instructorId;
  const isFeatured = parseBooleanQuery(query.isFeatured);
  if (isFeatured !== undefined) filter.isFeatured = isFeatured;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { shortDescription: regex },
      { tags: regex },
    ];
  }

  return filter;
};

const authService = {
  async register(payload) {
    ensureRoleAllowed(payload.role || "student");

    const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, "Email already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, config.bcryptSaltRounds);
    const user = await User.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: payload.role || "student",
      avatar: payload.avatar || "",
      bio: payload.bio || "",
    });

    const tokens = await buildTokens(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async login(payload) {
    const user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (user.status !== "active") {
      throw new ApiError(403, "User account is blocked");
    }

    const matched = await bcrypt.compare(payload.password, user.passwordHash);
    if (!matched) {
      throw new ApiError(401, "Invalid credentials");
    }

    const tokens = await buildTokens(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async refresh(refreshToken) {
    const decoded = await verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub);
    if (!user || user.status !== "active") {
      throw new ApiError(401, "User is no longer active");
    }

    await deleteRefreshToken(refreshToken);
    const tokens = await buildTokens(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async logout(refreshToken) {
    if (refreshToken) {
      await deleteRefreshToken(refreshToken);
    }
    return { success: true };
  },

  async requestPasswordReset(email) {
    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, status: "active" });

    if (!user) {
      return {
        message: "If the account exists, a password reset link has been generated.",
      };
    }

    const token = buildResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await createResetToken({
      token,
      userId: user._id,
      email: normalizedEmail,
      expiresAt,
    });

    const response = {
      message: "Password reset link generated.",
    };

    if (process.env.NODE_ENV !== "production") {
      response.resetToken = token;
      response.resetUrl = `/reset-password?token=${token}`;
    }

    return response;
  },

  async resetPassword(payload) {
    const resetRecord = await getResetToken(payload.token);
    if (!resetRecord) {
      throw new ApiError(400, "Reset token is invalid or expired");
    }

    if (resetRecord.usedAt) {
      throw new ApiError(400, "Reset token has already been used");
    }

    if (resetRecord.expiresAt && resetRecord.expiresAt < new Date()) {
      throw new ApiError(400, "Reset token is invalid or expired");
    }

    const user = await User.findById(resetRecord.userId);
    if (!user || user.email !== resetRecord.email || user.status !== "active") {
      throw new ApiError(400, "Reset token is invalid or expired");
    }

    user.passwordHash = await bcrypt.hash(payload.password, config.bcryptSaltRounds);
    await user.save();

    await Promise.all([
      markResetTokenUsed(payload.token),
      deleteTokensByUserId(user._id),
      deleteResetTokensByUserId(user._id),
    ]);

    return {
      message: "Password updated successfully",
    };
  },

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    return sanitizeUser(user);
  },

  async listUsers(query) {
    return paginate(User, {}, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, select: "-passwordHash" });
  },
};

const userService = {
  async updateMe(userId, payload) {
    const updates = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.avatar !== undefined) updates.avatar = payload.avatar;
    if (payload.bio !== undefined) updates.bio = payload.bio;
    if (payload.email !== undefined) updates.email = payload.email.toLowerCase();
    if (payload.password !== undefined) {
      updates.passwordHash = await bcrypt.hash(payload.password, config.bcryptSaltRounds);
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) throw new ApiError(404, "User not found");
    return sanitizeUser(user);
  },

  async getById(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "User not found");
    return sanitizeUser(user);
  },

  async updateStatus(actor, id, status) {
    if (String(actor.id) === String(id) && status === "blocked") {
      throw new ApiError(400, "You cannot block your own admin account");
    }

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) throw new ApiError(404, "User not found");

    if (userToUpdate.role === "admin" && status === "blocked") {
      const activeAdmins = await User.countDocuments({ role: "admin", status: "active" });
      if (activeAdmins <= 1) {
        throw new ApiError(409, "The platform must keep at least one active admin account");
      }
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) throw new ApiError(404, "User not found");
    if (status === "blocked") await deleteTokensByUserId(id);
    return sanitizeUser(user);
  },
};

const courseService = {
  async listPublic(query) {
    const cacheKey = `catalog:courses:${JSON.stringify({
      page: query.page || 1,
      limit: query.limit || 12,
      categoryId: query.categoryId || "",
      level: query.level || "",
      instructorId: query.instructorId || "",
      isFeatured: query.isFeatured || "",
      minPrice: query.minPrice || "",
      maxPrice: query.maxPrice || "",
      search: query.search || "",
    })}`;
    return getOrSetJson(cacheKey, async () => paginate(Course, courseSearchFilter(query), {
      page: query.page,
      limit: query.limit,
      sort: { createdAt: -1 },
    }));
  },

  async getPublicBySlug(slug) {
    const course = await Course.findOne({ slug, isPublished: true });
    if (!course) throw new ApiError(404, "Course not found");

    const sections = await CourseSection.find({ courseId: course._id }).sort({ order: 1 });
    const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 });

    return { course, sections, lessons };
  },

  async create(actor, payload) {
    if (!["instructor", "admin"].includes(actor.role)) {
      throw new ApiError(403, "Only instructors or admins can create courses");
    }

    const baseSlug = slugify(payload.title);
    let slug = baseSlug;
    let counter = 1;
    while (await Course.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const course = await Course.create({
      title: payload.title,
      slug,
      description: payload.description,
      shortDescription: payload.shortDescription || "",
      thumbnailUrl: payload.thumbnailUrl || "",
      previewVideoUrl: payload.previewVideoUrl || "",
      price: payload.price,
      discountPrice: payload.discountPrice || 0,
      level: payload.level || "beginner",
      language: payload.language || "en",
      categoryId: payload.categoryId || null,
      instructorId: actor.role === "admin" && payload.instructorId ? payload.instructorId : actor.id,
      tags: payload.tags || [],
      isPublished: Boolean(payload.isPublished),
      isFeatured: Boolean(payload.isFeatured),
    });

    return course;
  },

  async update(actor, courseId, payload) {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found");
    if (!isOwnerOrAdmin(actor, course.instructorId)) {
      throw new ApiError(403, "You cannot edit this course");
    }

    const updates = pickCourseUpdates(payload);
    if (payload.title && payload.title !== course.title) {
      const baseSlug = slugify(payload.title);
      let slug = baseSlug;
      let counter = 1;
      while (await Course.findOne({ slug, _id: { $ne: courseId } })) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
      }
      updates.slug = slug;
    }

    const updated = await Course.findByIdAndUpdate(courseId, updates, { new: true });
    return updated;
  },

  async delete(actor, courseId) {
    if (actor.role !== "admin") {
      throw new ApiError(403, "Only admins can delete courses");
    }
    const course = await Course.findByIdAndDelete(courseId);
    if (!course) throw new ApiError(404, "Course not found");
    await Promise.all([
      CourseSection.deleteMany({ courseId }),
      Lesson.deleteMany({ courseId }),
      Enrollment.deleteMany({ courseId }),
      Review.deleteMany({ courseId }),
      Wishlist.deleteMany({ courseId }),
      CourseProgress.deleteMany({ courseId }),
      OrderItem.deleteMany({ courseId }),
    ]);
    return course;
  },

  async publish(actor, courseId, isPublished) {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found");
    if (!isOwnerOrAdmin(actor, course.instructorId)) {
      throw new ApiError(403, "You cannot update this course");
    }
    return Course.findByIdAndUpdate(courseId, { isPublished }, { new: true });
  },

  async adminList(query) {
    const filter = {};
    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [{ title: regex }, { description: regex }, { shortDescription: regex }];
    }
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.level) filter.level = query.level;
    if (query.instructorId) filter.instructorId = query.instructorId;
    return paginate(Course, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 } });
  },

  async instructorCourses(instructorId, query) {
    return paginate(Course, { instructorId }, { page: query.page, limit: query.limit, sort: { createdAt: -1 } });
  },

  async instructorStats(instructorId) {
    const courses = await Course.find({ instructorId });
    const courseIds = courses.map((course) => course._id);
    const enrollments = await Enrollment.countDocuments({ courseId: { $in: courseIds } });
    const ratings = await Review.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: null,
          ratingAvg: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);
    const revenue = await Order.aggregate([
      { $match: { status: "paid" } },
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "items",
        },
      },
      { $unwind: "$items" },
      { $match: { "items.courseId": { $in: courseIds } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$amount" },
        },
      },
    ]);
    return {
      totalCourses: courses.length,
      totalStudents: enrollments,
      revenue: revenue[0]?.revenue || 0,
      ratingAvg: ratings[0]?.ratingAvg || 0,
      ratingCount: ratings[0]?.ratingCount || 0,
    };
  },

  async adminStats() {
    const [users, courses, orders] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Order.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    return {
      users,
      courses,
      revenue: orders[0]?.revenue || 0,
    };
  },
};

const sectionService = {
  async create(actor, courseId, payload) {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found");
    if (!isOwnerOrAdmin(actor, course.instructorId)) throw new ApiError(403, "You cannot edit this course");

    const sectionCount = await CourseSection.countDocuments({ courseId });
    return CourseSection.create({
      courseId,
      title: payload.title,
      order: payload.order || sectionCount + 1,
    });
  },

  async update(actor, sectionId, payload) {
    const section = await CourseSection.findById(sectionId);
    if (!section) throw new ApiError(404, "Section not found");
    const course = await Course.findById(section.courseId);
    if (!course || !isOwnerOrAdmin(actor, course.instructorId)) throw new ApiError(403, "You cannot edit this section");
    return CourseSection.findByIdAndUpdate(sectionId, pickSectionUpdates(payload), { new: true });
  },

  async delete(actor, sectionId) {
    const section = await CourseSection.findById(sectionId);
    if (!section) throw new ApiError(404, "Section not found");
    const course = await Course.findById(section.courseId);
    if (!course || !isOwnerOrAdmin(actor, course.instructorId)) throw new ApiError(403, "You cannot edit this section");
    await Lesson.deleteMany({ sectionId });
    return CourseSection.findByIdAndDelete(sectionId);
  },
};

const lessonService = {
  async create(actor, sectionId, payload) {
    const section = await CourseSection.findById(sectionId);
    if (!section) throw new ApiError(404, "Section not found");
    const course = await Course.findById(section.courseId);
    if (!course || !isOwnerOrAdmin(actor, course.instructorId)) throw new ApiError(403, "You cannot edit this course");
    const lessonCount = await Lesson.countDocuments({ courseId: course._id, sectionId });
    return Lesson.create({
      courseId: course._id,
      sectionId,
      title: payload.title,
      type: payload.type,
      content: payload.content || "",
      videoUrl: payload.videoUrl || "",
      fileKey: payload.fileKey || payload.fileUrl || "",
      duration: payload.duration || 0,
      isPreview: Boolean(payload.isPreview),
      order: payload.order || lessonCount + 1,
    });
  },

  async update(actor, lessonId, payload) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new ApiError(404, "Lesson not found");
    const course = await Course.findById(lesson.courseId);
    if (!course || !isOwnerOrAdmin(actor, course.instructorId)) throw new ApiError(403, "You cannot edit this lesson");
    return Lesson.findByIdAndUpdate(lessonId, pickLessonUpdates(payload), { new: true });
  },

  async delete(actor, lessonId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new ApiError(404, "Lesson not found");
    const course = await Course.findById(lesson.courseId);
    if (!course || !isOwnerOrAdmin(actor, course.instructorId)) throw new ApiError(403, "You cannot edit this lesson");
    await CourseProgress.deleteMany({ lessonId });
    return Lesson.findByIdAndDelete(lessonId);
  },
};

const enrollmentService = {
  async enroll(actor, payload) {
    if (actor.role !== "student") {
      throw new ApiError(403, "Only students can enroll in courses");
    }

    const course = await Course.findById(payload.courseId);
    if (!course || !course.isPublished) throw new ApiError(404, "Course not found");

    const existingEnrollment = await Enrollment.findOne({ userId: actor.id, courseId: payload.courseId });
    if (existingEnrollment && existingEnrollment.status !== "refunded") {
      return existingEnrollment;
    }

    const coursePrice = resolveCoursePrice(course);
    if (coursePrice > 0 && !(await hasPaidOrderForCourse(actor.id, course._id))) {
      throw new ApiError(402, "Payment is required before enrolling in this course");
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { userId: actor.id, courseId: payload.courseId },
      {
        $set: {
          status: existingEnrollment?.progressPercent === 100 ? "completed" : "active",
        },
        $setOnInsert: {
          userId: actor.id,
          courseId: payload.courseId,
          status: "active",
          progressPercent: 0,
          completedLessonIds: [],
        },
      },
      { new: true, upsert: true }
    );

    await Course.updateOne({ _id: payload.courseId }, { $inc: { enrollmentCount: 1 } });
    return enrollment;
  },

  async myEnrollments(userId) {
    const enrollments = await Enrollment.find({ userId }).sort({ createdAt: -1 });
    return enrollments;
  },

  async updateProgress(actor, payload) {
    const enrollment = await Enrollment.findOne({
      userId: actor.id,
      courseId: payload.courseId,
      status: { $in: ["active", "completed"] },
    });
    if (!enrollment) throw new ApiError(404, "Enrollment not found");

    const lesson = await Lesson.findOne({
      _id: payload.lessonId,
      courseId: payload.courseId,
    });
    if (!lesson) throw new ApiError(404, "Lesson not found");

    const progress = await CourseProgress.findOneAndUpdate(
      { userId: actor.id, courseId: payload.courseId, lessonId: payload.lessonId },
      {
        $set: {
          watchedSeconds: payload.watchedSeconds || 0,
          isCompleted: Boolean(payload.isCompleted),
        },
      },
      { new: true, upsert: true }
    );

    if (payload.isCompleted) {
      if (!enrollment.completedLessonIds.some((item) => String(item) === String(payload.lessonId))) {
        enrollment.completedLessonIds.push(payload.lessonId);
      }
    }

    enrollment.lastViewedLessonId = payload.lessonId;

    const totalLessons = await Lesson.countDocuments({ courseId: payload.courseId });
    enrollment.progressPercent = totalLessons
      ? Math.min(100, Math.round((enrollment.completedLessonIds.length / totalLessons) * 100))
      : 0;
    enrollment.status = enrollment.progressPercent === 100 ? "completed" : "active";
    await enrollment.save();

    return progress;
  },

  async getCourseProgress(actor, courseId) {
    const records = await CourseProgress.find({ userId: actor.id, courseId }).sort({ createdAt: -1 });
    return records;
  },

  async getLessonAccessUrl(actor, courseId, lessonId) {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found");

    const lesson = await Lesson.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new ApiError(404, "Lesson not found");

    const isOwner = isOwnerOrAdmin(actor, course.instructorId);
    const isEnrolled = Boolean(
      await Enrollment.findOne({
        userId: actor.id,
        courseId,
        status: { $in: ["active", "completed"] },
      })
    );
    const canPreview = Boolean(lesson.isPreview);

    if (!isOwner && actor.role !== "admin" && !isEnrolled && !canPreview) {
      throw new ApiError(403, "You do not have access to this lesson");
    }

    const storageKey = lesson.fileKey || lesson.fileUrl || lesson.videoUrl;
    if (!storageKey) {
      throw new ApiError(404, "Lesson media not found");
    }

    if (/^https?:\/\//i.test(storageKey)) {
      return { url: storageKey, fileKey: lesson.fileKey || storageKey };
    }

    const signed = createPresignedGetUrl({ key: storageKey });
    return {
      url: signed.signedUrl,
      fileKey: storageKey,
      expiresInSeconds: signed.expiresInSeconds,
    };
  },
};

const getWebhookMonitoringContext = (body, rawBody) => {
  const meta = body?.meta || {};
  const customData = meta.custom_data || meta.customData || {};
  const payload = body?.data || body || {};
  const attributes = payload.attributes || {};
  const webhookId = String(meta.webhook_id || meta.webhookId || "").trim();
  const deliveryKey = webhookId || crypto.createHash("sha256").update(String(rawBody || "")).digest("hex");

  return {
    deliveryKey,
    webhookId,
    eventName: String(meta.event_name || meta.eventName || ""),
    providerOrderId: String(payload.id || ""),
    localOrderId: String(customData.order_id || customData.orderId || attributes.custom_data?.order_id || ""),
  };
};

const beginWebhookMonitoring = async ({ body, rawBody }) => {
  if (mongoose.connection.readyState !== 1) return null;
  try {
    const context = getWebhookMonitoringContext(body, rawBody);
    return await WebhookDelivery.findOneAndUpdate(
      { deliveryKey: context.deliveryKey },
      {
        $set: { ...context, status: "received", lastError: "", receivedAt: new Date() },
        $inc: { attempts: 1 },
        $setOnInsert: { provider: "lemon_squeezy" },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    log("warn", "webhook.monitoring_failed", { error: { name: error?.name, message: error?.message } });
    return null;
  }
};

const completeWebhookMonitoring = async (delivery, result) => {
  if (!delivery || mongoose.connection.readyState !== 1) return;
  try {
    await WebhookDelivery.updateOne(
      { _id: delivery._id },
      { $set: { status: result?.skipped ? "ignored" : "processed", responseStatus: 200, processedAt: new Date(), lastError: "" } }
    );
  } catch (error) {
    log("warn", "webhook.monitoring_update_failed", { error: { name: error?.name, message: error?.message } });
  }
};

const failWebhookMonitoring = async (delivery, error) => {
  if (!delivery || mongoose.connection.readyState !== 1) return;
  try {
    await WebhookDelivery.updateOne(
      { _id: delivery._id },
      { $set: { status: "failed", responseStatus: error?.statusCode || 500, lastError: String(error?.message || "Webhook processing failed").slice(0, 500) } }
    );
  } catch (monitoringError) {
    log("warn", "webhook.monitoring_update_failed", { error: { name: monitoringError?.name, message: monitoringError?.message } });
  }
};

const orderService = {
  async create(actor, payload) {
    if (actor.role !== "student") throw new ApiError(403, "Only students can place orders");

    const courseIds = Array.from(new Set(payload.courseIds || []));
    const noteIds = Array.from(new Set(payload.noteIds || []));
    if (courseIds.length === 0 && noteIds.length === 0) throw new ApiError(400, "At least one resource is required");
    if (courseIds.length > 0 && noteIds.length > 0) throw new ApiError(400, "Courses and notes must be purchased separately");

    const resourceType = noteIds.length > 0 ? "note" : "course";
    const courses = resourceType === "course" ? await Course.find({ _id: { $in: courseIds }, isPublished: true }) : [];
    const notes = resourceType === "note" ? await Note.find({ _id: { $in: noteIds }, isPublished: true }) : [];
    const requestedCount = resourceType === "note" ? noteIds.length : courseIds.length;
    const resources = resourceType === "note" ? notes : courses;
    if (resources.length !== requestedCount) throw new ApiError(404, "One or more resources were not found");
    if (resourceType === "note" && resources.some((note) => Number(note.price || 0) <= 0)) {
      throw new ApiError(400, "Free notes should be added to the vault instead of checked out");
    }

    let subtotal = 0;
    resources.forEach((resource) => {
      subtotal += resourceType === "note" ? Number(resource.price || 0) : resolveCoursePrice(resource);
    });

    const { order, amount, couponCode } = await runDatabaseTransaction(async (session) => {
      let discount = 0;
      let couponCode = "";
      let couponReservationExpiresAt = null;
      let couponReservationHeld = false;

      if (payload.couponCode) {
        await assertCouponNotUsedByUser(actor.id, payload.couponCode);
        const coupon = await reserveCoupon(payload.couponCode, session);
        discount = getCouponDiscountAmount(coupon, subtotal);
        couponCode = coupon.code;
        couponReservationExpiresAt = new Date(
          Date.now() + config.couponReservationTtlMinutes * 60 * 1000
        );
        couponReservationHeld = true;
      }

      const amount = Math.max(subtotal - discount, 0);
      const [createdOrder] = await Order.create(
        [{
          userId: actor.id,
          amount,
          currency: payload.currency || "INR",
          status: "pending",
          resourceType,
          paymentProvider: "lemon_squeezy",
          paymentIntentId: "",
          couponCode,
          couponReservationExpiresAt,
          couponReservationReleased: !couponReservationHeld,
        }],
        { session }
      );

      await OrderItem.insertMany(
        resources.map((resource) => ({
          orderId: createdOrder._id,
          ...(resourceType === "note" ? { noteId: resource._id } : { courseId: resource._id }),
          resourceType,
          priceAtPurchase: resourceType === "note" ? Number(resource.price || 0) : resolveCoursePrice(resource),
        })),
        { session }
      );

      return {
        order: createdOrder,
        amount,
        couponCode,
      };
    });

    let checkout;
    try {
      checkout = await createLemonSqueezyCheckout({
        amount: amount * 100,
        currency: payload.currency || "INR",
        orderId: order._id,
        userId: actor.id,
        userEmail: actor.email,
        courseIds,
        noteIds,
        resourceType,
        redirectPath: resourceType === "note" ? "/student/vault" : "/student/dashboard",
        couponCode,
      });
    } catch (error) {
      await markOrderFailed(order._id);
      throw error;
    }

    try {
      await runDatabaseTransaction(async (session) => {
        await Order.updateOne(
          { _id: order._id, status: "pending" },
          {
            $set: {
              paymentIntentId: checkout.checkoutId || "",
              paymentProvider: "lemon_squeezy",
            },
          },
          { session }
        );
      });
    } catch (error) {
      await markOrderFailed(order._id);
      throw error;
    }

    return {
      ...order.toObject(),
      paymentProvider: "lemon_squeezy",
      paymentIntentId: checkout.checkoutId || "",
      checkoutUrl: checkout.checkoutUrl,
    };
  },

  async myOrders(userId) {
    return Order.find({ userId }).sort({ createdAt: -1 });
  },

  async listOrders(query) {
    return paginate(Order, {}, { page: query.page, limit: query.limit, sort: { createdAt: -1 } });
  },

  async getAdminOrder(id) {
    const order = await Order.findById(id).lean();
    if (!order) throw new ApiError(404, "Order not found");

    const [items, user] = await Promise.all([
      OrderItem.find({ orderId: order._id }).lean(),
      User.findById(order.userId).select("name email role status avatar").lean(),
    ]);
    const courses = await Course.find({ _id: { $in: items.map((item) => item.courseId) } })
      .select("title slug thumbnailUrl price")
      .lean();
    const courseById = new Map(courses.map((course) => [String(course._id), course]));

    return {
      order,
      user,
      items: items.map((item) => ({ ...item, course: courseById.get(String(item.courseId)) || null })),
    };
  },

  async recordAdminRefund(id) {
    return runDatabaseTransaction(async (session) => {
      const order = await Order.findById(id).session(session);
      if (!order) throw new ApiError(404, "Order not found");
      if (order.status === "refunded") return order;
      if (order.status !== "paid") {
        throw new ApiError(400, "Only paid orders can be recorded as refunded");
      }

      await releaseOrderCouponReservation(order, session);
      await revokeOrderEnrollments(order, session);
      await revokeOrderNotePurchases(order, session);
      order.status = "refunded";
      await order.save({ session });
      return order;
    });
  },

  async listWebhookDeliveries(limit = 50) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    return WebhookDelivery.find({}).sort({ createdAt: -1 }).limit(safeLimit).lean();
  },

  async processLemonSqueezyWebhook({ rawBody, signature, body }) {
    verifyLemonSqueezyWebhookSignature({ rawBody, signature });

    const { eventName, customData, payload } = parseLemonSqueezyWebhookBody(body);
    const orderId =
      customData?.order_id ||
      customData?.orderId ||
      payload?.attributes?.custom_data?.order_id ||
      payload?.attributes?.custom_data?.orderId;

    if (!orderId) {
      throw new ApiError(400, "Webhook payload is missing order metadata");
    }

    let order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (eventName === "order_refunded") {
      return runDatabaseTransaction(async (session) => {
        const currentOrder = await Order.findById(order._id).session(session);
        if (!currentOrder) throw new ApiError(404, "Order not found");

        await releaseOrderCouponReservation(currentOrder, session);
        await revokeOrderEnrollments(currentOrder, session);
        await revokeOrderNotePurchases(currentOrder, session);
        currentOrder.status = "refunded";
        await currentOrder.save({ session });

        return { ok: true, eventName, orderId: String(currentOrder._id), status: currentOrder.status };
      });
    }

    if (eventName !== "order_created") {
      return { ok: true, skipped: true, eventName, orderId: String(order._id) };
    }

    const providerStatus = payload?.attributes?.status || "";
    if (providerStatus && providerStatus !== "paid") {
      return { ok: true, skipped: true, eventName, orderId: String(order._id), status: providerStatus };
    }

    const { providerOrderId } = reconcileLemonSqueezyOrder(order, payload);

    await releaseExpiredCouponReservations();

    return runDatabaseTransaction(async (session) => {
      const currentOrder = await Order.findById(order._id).session(session);
      if (!currentOrder) throw new ApiError(404, "Order not found");

      if (currentOrder.status === "paid") {
        await ensureOrderEnrollments(currentOrder, session);
        await ensureOrderNotePurchases(currentOrder, session, currentOrder.paymentIntentId);
        return {
          ok: true,
          alreadyProcessed: true,
          orderId: String(currentOrder._id),
          status: currentOrder.status,
        };
      }

      await finalizeCouponRedemption(currentOrder, session);

      currentOrder.status = "paid";
      currentOrder.paymentProvider = "lemon_squeezy";
      currentOrder.paymentIntentId = providerOrderId;
      currentOrder.couponRedeemedAt = currentOrder.couponCode ? new Date() : null;
      currentOrder.couponReservationReleased = true;
      currentOrder.couponReservationExpiresAt = null;
      await currentOrder.save({ session });

      await ensureOrderEnrollments(currentOrder, session);
      await ensureOrderNotePurchases(currentOrder, session, providerOrderId);

      return {
        ok: true,
        eventName,
        orderId: String(currentOrder._id),
        status: currentOrder.status,
      };
    });
  },

  async handleLemonSqueezyWebhook(args) {
    const delivery = await beginWebhookMonitoring(args);
    try {
      const result = await this.processLemonSqueezyWebhook(args);
      await completeWebhookMonitoring(delivery, result);
      return result;
    } catch (error) {
      await failWebhookMonitoring(delivery, error);
      throw error;
    }
  },
};

const reviewService = {
  async create(actor, courseId, payload) {
    if (actor.role !== "student") {
      throw new ApiError(403, "Only enrolled students can create course reviews");
    }

    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found");

    const enrollment = await Enrollment.findOne({
      userId: actor.id,
      courseId,
      status: { $in: ["active", "completed"] },
    });
    if (!enrollment) {
      throw new ApiError(403, "You must be enrolled in this course before reviewing it");
    }

    const review = await Review.findOneAndUpdate(
      { userId: actor.id, courseId },
      {
        $set: {
          rating: payload.rating,
          title: payload.title || "",
          comment: payload.comment || "",
          isVerifiedPurchase: true,
        },
      },
      { new: true, upsert: true }
    );

    await recalcCourseRatings(courseId);
    return review;
  },

  async list(courseId, query) {
    return paginate(Review, { courseId }, { page: query.page, limit: query.limit, sort: { createdAt: -1 } });
  },

  async remove(actor, reviewId) {
    const review = await Review.findById(reviewId);
    if (!review) throw new ApiError(404, "Review not found");
    if (!isOwnerOrAdmin(actor, review.userId)) throw new ApiError(403, "You cannot delete this review");
    await review.deleteOne();
    await recalcCourseRatings(review.courseId);
    return { success: true };
  },
};

const wishlistService = {
  async add(actor, courseId) {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found");
    return Wishlist.findOneAndUpdate(
      { userId: actor.id, courseId },
      { $setOnInsert: { userId: actor.id, courseId } },
      { new: true, upsert: true }
    );
  },

  async remove(actor, courseId) {
    await Wishlist.deleteOne({ userId: actor.id, courseId });
    return { success: true };
  },

  async list(actor) {
    return Wishlist.find({ userId: actor.id }).sort({ createdAt: -1 });
  },
};

const canDownloadNote = async (actor, note) => {
  if (isOwnerOrAdmin(actor, note.sellerId) || Number(note.price || 0) === 0) return true;
  return Boolean(await NotePurchase.exists({ noteId: note._id, userId: actor.id, status: "completed" }));
};

const noteService = {
  async listPublic(query = {}) {
    const cacheKey = `catalog:notes:${JSON.stringify({
      subject: query.subject || "",
      search: query.search || "",
      limit: Math.min(Math.max(Number(query.limit) || 24, 1), 100),
    })}`;
    return getOrSetJson(cacheKey, async () => {
      const filter = { isPublished: true };
      if (query.subject) filter.subject = String(query.subject).trim();
      if (query.search) {
        const search = String(query.search).trim();
        if (search) filter.$or = [{ title: new RegExp(search, "i") }, { description: new RegExp(search, "i") }];
      }

      return Note.find(filter)
        .select("title slug description subject price currency fileName thumbnailUrl purchaseCount sellerId createdAt")
        .populate("sellerId", "name avatar role")
        .sort({ createdAt: -1 })
        .limit(Math.min(Math.max(Number(query.limit) || 24, 1), 100))
        .lean();
    });
  },

  async listMine(actor) {
    if (!['instructor', 'admin'].includes(actor.role)) throw new ApiError(403, 'Only instructors or admins can manage notes');
    return Note.find(actor.role === 'admin' ? {} : { sellerId: actor.id })
      .select('title slug description subject price currency fileName fileSize isPublished purchaseCount downloadCount sellerId createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();
  },

  async getPublicBySlug(slug) {
    const note = await Note.findOne({ slug, isPublished: true })
      .select("-fileKey")
      .populate("sellerId", "name avatar role")
      .lean();
    if (!note) throw new ApiError(404, "Note not found");
    return note;
  },

  async create(actor, payload) {
    if (!["instructor", "admin"].includes(actor.role)) throw new ApiError(403, "Only instructors or admins can create notes");
    if (!String(payload.fileKey).startsWith("notes/")) throw new ApiError(400, "Upload the PDF to the notes folder first");

    const baseSlug = slugify(payload.title);
    let slug = baseSlug;
    let counter = 1;
    while (await Note.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return Note.create({
      sellerId: actor.id,
      title: payload.title,
      slug,
      description: payload.description,
      subject: payload.subject,
      price: payload.price,
      currency: "INR",
      fileKey: payload.fileKey,
      fileName: payload.fileName,
      fileSize: payload.fileSize || 0,
      thumbnailUrl: payload.thumbnailUrl || "",
      isPublished: Boolean(payload.isPublished),
    });
  },

  async update(actor, id, payload) {
    const note = await Note.findById(id);
    if (!note) throw new ApiError(404, "Note not found");
    if (!isOwnerOrAdmin(actor, note.sellerId)) throw new ApiError(403, "You cannot edit this note");
    if (payload.fileKey !== undefined && !String(payload.fileKey).startsWith("notes/")) {
      throw new ApiError(400, "Note files must be stored in the notes folder");
    }

    const allowed = ["title", "description", "subject", "price", "fileKey", "fileName", "fileSize", "thumbnailUrl", "isPublished"];
    allowed.forEach((field) => {
      if (payload[field] !== undefined) note[field] = payload[field];
    });
    if (payload.title && payload.title !== note.title) note.slug = slugify(payload.title);
    await note.save();
    return note;
  },

  async remove(actor, id) {
    const note = await Note.findById(id);
    if (!note) throw new ApiError(404, "Note not found");
    if (!isOwnerOrAdmin(actor, note.sellerId)) throw new ApiError(403, "You cannot delete this note");
    await NotePurchase.deleteMany({ noteId: note._id });
    await note.deleteOne();
    return { success: true };
  },

  async purchase(actor, id) {
    if (actor.role !== "student") throw new ApiError(403, "Only students can purchase notes");
    const note = await Note.findOne({ _id: id, isPublished: true });
    if (!note) throw new ApiError(404, "Note not found");
    if (note.price > 0) throw new ApiError(402, "Paid note checkout is not configured yet");

    const existing = await NotePurchase.findOne({ noteId: note._id, userId: actor.id });
    if (existing?.status === "completed") return existing;
    const purchase = await NotePurchase.findOneAndUpdate(
      { noteId: note._id, userId: actor.id },
      { $set: { amount: 0, currency: note.currency, status: "completed", purchasedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Note.updateOne({ _id: note._id }, { $inc: { purchaseCount: existing ? 0 : 1 } });
    return purchase;
  },

  async download(actor, id) {
    const note = await Note.findOne({ _id: id, isPublished: true });
    if (!note) throw new ApiError(404, "Note not found");
    if (!(await canDownloadNote(actor, note))) {
      throw new ApiError(403, "Purchase this note before downloading it");
    }

    const signed = createPresignedGetUrl({ key: note.fileKey });
    await Note.updateOne({ _id: note._id }, { $inc: { downloadCount: 1 } });
    return { url: signed.signedUrl, fileName: note.fileName, expiresInSeconds: signed.expiresInSeconds };
  },

  async myPurchases(userId) {
    return NotePurchase.find({ userId, status: "completed" }).populate("noteId").sort({ purchasedAt: -1 });
  },
};

const categoryService = {
  async list() {
    return Category.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
  },

  async create(payload) {
    const categoryPayload = pickCategoryPayload(payload);
    const slug = categoryPayload.slug || slugify(categoryPayload.name);
    return Category.create({ ...categoryPayload, slug });
  },

  async update(id, payload) {
    const updates = pickCategoryPayload(payload);
    if (payload.name && !payload.slug) {
      updates.slug = slugify(payload.name);
    }
    return Category.findByIdAndUpdate(id, updates, { new: true });
  },

  async remove(id) {
    const category = await Category.findById(id);
    if (!category) throw new ApiError(404, "Category not found");

    const courseUsingCategory = await Course.exists({ categoryId: id });
    if (courseUsingCategory) {
      throw new ApiError(409, "This category is still used by one or more courses");
    }

    category.isActive = false;
    await category.save();
    return category;
  },
};

const couponService = {
  async create(payload) {
    const couponPayload = pickCouponPayload(payload);
    return Coupon.create({
      ...couponPayload,
      code: String(couponPayload.code).toUpperCase(),
      redeemedCount: couponPayload.redeemedCount || 0,
    });
  },

  async list() {
    return Coupon.find({}).sort({ createdAt: -1 });
  },

  async update(id, payload) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new ApiError(404, "Coupon not found");

    const updates = pickCouponPayload(payload);
    if (updates.code) {
      updates.code = String(updates.code).toUpperCase();
      if (updates.code !== coupon.code && (coupon.redeemedCount > 0 || coupon.reservedCount > 0)) {
        throw new ApiError(409, "A redeemed or reserved coupon code cannot be changed");
      }
    }

    const maxRedemptions = updates.maxRedemptions ?? coupon.maxRedemptions;
    if (maxRedemptions < (coupon.redeemedCount || 0) + (coupon.reservedCount || 0)) {
      throw new ApiError(400, "Maximum redemptions cannot be lower than existing usage");
    }

    Object.assign(coupon, updates);
    await coupon.save();
    return coupon;
  },

  async remove(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new ApiError(404, "Coupon not found");
    coupon.isActive = false;
    await coupon.save();
    return coupon;
  },

  async validate(code, subtotal = 0, userId) {
    await assertCouponNotUsedByUser(userId, code);
    const coupon = await getActiveCouponByCode(code);
    const discountAmount = getCouponDiscountAmount(coupon, subtotal);
    return {
      coupon,
      subtotal: Math.max(0, Number(subtotal) || 0),
      discountAmount,
      total: Math.max(0, Math.max(0, Number(subtotal) || 0) - discountAmount),
    };
  },
};

const notificationService = {
  async list(userId) {
    return Notification.find({ userId }).sort({ createdAt: -1 });
  },

  async markRead(userId, id) {
    const note = await Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
    if (!note) throw new ApiError(404, "Notification not found");
    return note;
  },

  async markAllRead(userId) {
    await Notification.updateMany({ userId, read: false }, { read: true });
    return { success: true };
  },
};

const platformService = {
  async stats() {
    const [students, instructors, courses, avatarUsers] = await Promise.all([
      User.countDocuments({ role: "student", status: "active" }),
      User.countDocuments({ role: "instructor", status: "active" }),
      Course.countDocuments({ isPublished: true }),
      User.find({
        role: { $in: ["student", "instructor"] },
        status: "active",
        avatar: { $nin: ["", null] },
      })
        .select("avatar -_id")
        .limit(4)
        .lean(),
    ]);

    return {
      students,
      instructors,
      courses,
      avatars: avatarUsers.map(({ avatar }) => avatar).filter(Boolean),
    };
  },
};

module.exports = {
  sanitizeUser,
  buildTokens,
  authService,
  userService,
  courseService,
  sectionService,
  lessonService,
  enrollmentService,
  orderService,
  reviewService,
  wishlistService,
  noteService,
  categoryService,
  couponService,
  notificationService,
  platformService,
  upsertNotification,
  recalcCourseRatings,
  resolveCoursePrice,
  reconcileLemonSqueezyOrder,
  canDownloadNote,
  releaseExpiredCouponReservations,
};
