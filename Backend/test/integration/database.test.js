const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");

const config = require("../../config");
const {
  User,
  Course,
  CourseSection,
  Lesson,
  Enrollment,
  Order,
  OrderItem,
  Coupon,
  Note,
  NotePurchase,
} = require("../../models");
const { enrollmentService, orderService, canDownloadNote } = require("../../services");

const hasTestDatabase = Boolean(config.testMongoUrl);
const describeDatabase = hasTestDatabase ? test : test;

test.before(async () => {
  if (!hasTestDatabase) return;
  await mongoose.connect(config.testMongoUrl, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([
    User.deleteMany({}), Course.deleteMany({}), CourseSection.deleteMany({}), Lesson.deleteMany({}),
    Enrollment.deleteMany({}), Order.deleteMany({}), OrderItem.deleteMany({}), Coupon.deleteMany({}),
    Note.deleteMany({}), NotePurchase.deleteMany({}),
  ]);
});

test.after(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});

function requireDatabase() {
  if (!hasTestDatabase) return false;
  return true;
}

async function createFixture({ price = 1000 } = {}) {
  const instructor = await User.create({ name: "Integration Instructor", email: `instructor-${Date.now()}@test.local`, passwordHash: "hash", role: "instructor" });
  const student = await User.create({ name: "Integration Student", email: `student-${Date.now()}@test.local`, passwordHash: "hash", role: "student" });
  const course = await Course.create({ title: "Integration Course", slug: `integration-${Date.now()}`, description: "A test course", price, instructorId: instructor._id, isPublished: true });
  return { instructor, student, course };
}

test("paid enrollment protection rejects a student without a paid order", async (t) => {
  if (!requireDatabase()) return t.skip("TEST_MONGODB_URL is not configured");
  const { student, course } = await createFixture({ price: 1500 });
  await assert.rejects(
    enrollmentService.enroll({ id: student._id, role: "student" }, { courseId: course._id }),
    (error) => error.statusCode === 402
  );
  assert.equal(await Enrollment.countDocuments({ userId: student._id, courseId: course._id }), 0);
});

test("refunded enrollment cannot access lesson media", async (t) => {
  if (!requireDatabase()) return t.skip("TEST_MONGODB_URL is not configured");
  const { student, course } = await createFixture({ price: 0 });
  const section = await CourseSection.create({ courseId: course._id, title: "Section", order: 1 });
  const lesson = await Lesson.create({ courseId: course._id, sectionId: section._id, title: "Lesson", type: "video", order: 1, fileKey: "lessonVideos/test.mp4" });
  await Enrollment.create({ userId: student._id, courseId: course._id, status: "refunded" });
  await assert.rejects(
    enrollmentService.getLessonAccessUrl({ id: student._id, role: "student" }, course._id, lesson._id),
    (error) => error.statusCode === 403
  );
});

test("transaction rollback restores coupon state after a failed write", async (t) => {
  if (!requireDatabase()) return t.skip("TEST_MONGODB_URL is not configured");
  const coupon = await Coupon.create({ code: `ROLLBACK${Date.now()}`, type: "percent", value: 10, reservedCount: 0 });
  const session = await mongoose.startSession();
  try {
    await assert.rejects(session.withTransaction(async () => {
      await Coupon.updateOne({ _id: coupon._id }, { $inc: { reservedCount: 1 } }, { session });
      throw new Error("simulated checkout failure");
    }));
  } finally {
    await session.endSession();
  }
  const reloaded = await Coupon.findById(coupon._id).lean();
  assert.equal(reloaded.reservedCount, 0);
});

test("duplicate order_created webhook is idempotent", async (t) => {
  if (!requireDatabase()) return t.skip("TEST_MONGODB_URL is not configured");
  if (!config.lemonSqueezyWebhookSecret || !config.lemonSqueezyStoreId || (!config.lemonSqueezyProductId && !config.lemonSqueezyVariantId)) {
    return t.skip("Lemon Squeezy webhook configuration is incomplete");
  }
  const { student, course } = await createFixture({ price: 1000 });
  const order = await Order.create({ userId: student._id, amount: 1000, currency: "INR", status: "pending" });
  await OrderItem.create({ orderId: order._id, courseId: course._id, priceAtPurchase: 1000 });
  const providerOrderId = `provider-${Date.now()}`;
  const body = {
    meta: { event_name: "order_created", custom_data: { order_id: String(order._id) } },
    data: {
      id: providerOrderId,
      attributes: {
        status: "paid",
        store_id: String(config.lemonSqueezyStoreId),
        currency: "INR",
        total: 100000,
        first_order_item: { product_id: String(config.lemonSqueezyProductId || ""), variant_id: String(config.lemonSqueezyVariantId || "") },
      },
    },
  };
  const rawBody = JSON.stringify(body);
  const signature = crypto.createHmac("sha256", config.lemonSqueezyWebhookSecret).update(rawBody).digest("hex");
  await orderService.processLemonSqueezyWebhook({ rawBody, signature, body });
  const second = await orderService.processLemonSqueezyWebhook({ rawBody, signature, body });
  assert.equal(second.alreadyProcessed, true);
  assert.equal(await Order.countDocuments({ _id: order._id, status: "paid" }), 1);
  assert.equal(await Enrollment.countDocuments({ userId: student._id, courseId: course._id }), 1);
});

test("free notes are downloadable while paid notes require a completed purchase", async (t) => {
  if (!requireDatabase()) return t.skip("TEST_MONGODB_URL is not configured");
  const { student, instructor } = await createFixture({ price: 0 });
  const freeNote = await Note.create({ sellerId: instructor._id, title: "Free", slug: `free-${Date.now()}`, description: "Free note", subject: "React", price: 0, fileKey: "notes/free.pdf", fileName: "free.pdf", isPublished: true });
  const paidNote = await Note.create({ sellerId: instructor._id, title: "Paid", slug: `paid-${Date.now()}`, description: "Paid note", subject: "React", price: 100, fileKey: "notes/paid.pdf", fileName: "paid.pdf", isPublished: true });
  assert.equal(await canDownloadNote({ id: student._id, role: "student" }, freeNote), true);
  assert.equal(await canDownloadNote({ id: student._id, role: "student" }, paidNote), false);
  await NotePurchase.create({ noteId: paidNote._id, userId: student._id, amount: 100, status: "completed" });
  assert.equal(await canDownloadNote({ id: student._id, role: "student" }, paidNote), true);
});
