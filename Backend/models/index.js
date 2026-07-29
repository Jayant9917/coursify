const mongoose = require("mongoose");

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
      index: true,
    },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    parentId: { type: ObjectId, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    previewVideoUrl: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    language: { type: String, default: "en" },
    categoryId: { type: ObjectId, default: null, index: true },
    instructorId: { type: ObjectId, required: true, index: true },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const courseSectionSchema = new Schema(
  {
    courseId: { type: ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

courseSectionSchema.index({ courseId: 1, order: 1 }, { unique: true });

const lessonSchema = new Schema(
  {
    courseId: { type: ObjectId, required: true, index: true },
    sectionId: { type: ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["video", "text", "pdf", "quiz"],
      required: true,
    },
    content: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileKey: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, sectionId: 1, order: 1 }, { unique: true });

const enrollmentSchema = new Schema(
  {
    userId: { type: ObjectId, required: true, index: true },
    courseId: { type: ObjectId, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "completed", "refunded"],
      default: "active",
    },
    progressPercent: { type: Number, default: 0 },
    lastViewedLessonId: { type: ObjectId, default: null },
    completedLessonIds: { type: [ObjectId], default: [] },
  },
  { timestamps: true }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const orderSchema = new Schema(
  {
    userId: { type: ObjectId, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    resourceType: { type: String, enum: ["course", "note"], default: "course", index: true },
    paymentProvider: { type: String, default: "manual" },
    paymentIntentId: { type: String, default: "" },
    couponCode: { type: String, default: "" },
    couponReservationExpiresAt: { type: Date, default: null },
    couponReservationReleased: { type: Boolean, default: false },
    couponRedeemedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });

const orderItemSchema = new Schema(
  {
    orderId: { type: ObjectId, required: true, index: true },
    courseId: { type: ObjectId, ref: "Course", default: null, index: true },
    noteId: { type: ObjectId, ref: "Note", default: null, index: true },
    resourceType: { type: String, enum: ["course", "note"], required: true, default: "course" },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

orderItemSchema.pre("validate", function validateResource(next) {
  const hasCourse = Boolean(this.courseId);
  const hasNote = Boolean(this.noteId);
  if (hasCourse === hasNote) return next(new Error("An order item must reference exactly one resource"));
  if (this.resourceType === "course" && !hasCourse) return next(new Error("Course order item is missing courseId"));
  if (this.resourceType === "note" && !hasNote) return next(new Error("Note order item is missing noteId"));
  next();
});

const reviewSchema = new Schema(
  {
    userId: { type: ObjectId, required: true, index: true },
    courseId: { type: ObjectId, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    comment: { type: String, default: "" },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ courseId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const wishlistSchema = new Schema(
  {
    userId: { type: ObjectId, required: true, index: true },
    courseId: { type: ObjectId, required: true, index: true },
  },
  { timestamps: true }
);

wishlistSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const courseProgressSchema = new Schema(
  {
    userId: { type: ObjectId, required: true, index: true },
    courseId: { type: ObjectId, required: true, index: true },
    lessonId: { type: ObjectId, required: true, index: true },
    watchedSeconds: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

courseProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

const importedPlaylistSchema = new Schema(
  {
    userId: { type: ObjectId, required: true, index: true },
    youtubePlaylistId: { type: String, required: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    channelTitle: { type: String, default: "" },
    videoCount: { type: Number, default: 0, min: 0 },
    totalDuration: { type: Number, default: 0, min: 0 },
    lastWatchedVideoId: { type: ObjectId, default: null },
    lastWatchedIndex: { type: Number, default: 0, min: 0 },
    lastWatchedSeconds: { type: Number, default: 0, min: 0 },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      index: true,
    },
    isAvailable: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

importedPlaylistSchema.index({ userId: 1, youtubePlaylistId: 1 }, { unique: true });

const importedPlaylistVideoSchema = new Schema(
  {
    playlistId: { type: ObjectId, required: true, index: true },
    youtubeVideoId: { type: String, required: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    durationSeconds: { type: Number, default: 0, min: 0 },
    position: { type: Number, required: true, min: 1 },
    watched: { type: Boolean, default: false, index: true },
    lastPositionSeconds: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

importedPlaylistVideoSchema.index({ playlistId: 1, youtubeVideoId: 1 }, { unique: true });

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    maxRedemptions: { type: Number, default: 1 },
    redeemedCount: { type: Number, default: 0 },
    reservedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const notificationSchema = new Schema(
  {
    userId: { type: ObjectId, required: true, index: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: ObjectId, required: true, index: true },
    role: { type: String, required: true, enum: ["student", "instructor", "admin"] },
    email: { type: String, required: true, lowercase: true, trim: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const passwordResetTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: ObjectId, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const webhookDeliverySchema = new Schema(
  {
    deliveryKey: { type: String, required: true, unique: true, index: true },
    provider: { type: String, default: "lemon_squeezy", index: true },
    webhookId: { type: String, default: "" },
    eventName: { type: String, default: "" },
    providerOrderId: { type: String, default: "" },
    localOrderId: { type: String, default: "" },
    status: { type: String, enum: ["received", "processed", "failed", "ignored"], default: "received", index: true },
    attempts: { type: Number, default: 0, min: 0 },
    responseStatus: { type: Number, default: null },
    lastError: { type: String, default: "" },
    receivedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

webhookDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const noteSchema = new Schema(
  {
    sellerId: { type: ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    subject: { type: String, required: true, trim: true, maxlength: 80, index: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, required: true, enum: ["INR"], default: "INR" },
    fileKey: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    contentType: { type: String, enum: ["application/pdf"], default: "application/pdf" },
    fileSize: { type: Number, min: 0, default: 0 },
    thumbnailUrl: { type: String, default: "" },
    isPublished: { type: Boolean, default: false, index: true },
    purchaseCount: { type: Number, default: 0, min: 0 },
    downloadCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

noteSchema.index({ isPublished: 1, createdAt: -1 });
noteSchema.index({ subject: 1, isPublished: 1, createdAt: -1 });

const notePurchaseSchema = new Schema(
  {
    noteId: { type: ObjectId, ref: "Note", required: true, index: true },
    userId: { type: ObjectId, required: true, index: true },
    orderId: { type: ObjectId, ref: "Order", default: null, index: true },
    providerOrderId: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, enum: ["INR"], default: "INR" },
    status: { type: String, enum: ["pending", "completed", "refunded"], default: "completed", index: true },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notePurchaseSchema.index({ userId: 1, noteId: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
const CourseSection = mongoose.models.CourseSection || mongoose.model("CourseSection", courseSectionSchema);
const Lesson = mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);
const Enrollment = mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
const OrderItem = mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);
const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
const Wishlist = mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);
const CourseProgress = mongoose.models.CourseProgress || mongoose.model("CourseProgress", courseProgressSchema);
const ImportedPlaylist =
  mongoose.models.ImportedPlaylist || mongoose.model("ImportedPlaylist", importedPlaylistSchema);
const ImportedPlaylistVideo =
  mongoose.models.ImportedPlaylistVideo || mongoose.model("ImportedPlaylistVideo", importedPlaylistVideoSchema);
const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
const RefreshToken = mongoose.models.RefreshToken || mongoose.model("RefreshToken", refreshTokenSchema);
const PasswordResetToken =
  mongoose.models.PasswordResetToken || mongoose.model("PasswordResetToken", passwordResetTokenSchema);
const WebhookDelivery = mongoose.models.WebhookDelivery || mongoose.model("WebhookDelivery", webhookDeliverySchema);
const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);
const NotePurchase = mongoose.models.NotePurchase || mongoose.model("NotePurchase", notePurchaseSchema);

module.exports = {
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
  ImportedPlaylist,
  ImportedPlaylistVideo,
  Coupon,
  Notification,
  RefreshToken,
  PasswordResetToken,
  WebhookDelivery,
  Note,
  NotePurchase,
};
