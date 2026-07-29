const mongoose = require("mongoose");
const config = require("../config");
const { Order, OrderItem, Enrollment } = require("../models");
const dryRun = process.argv.includes("--dry-run");

const migrateRefundedEnrollments = async () => {
  await mongoose.connect(config.mongoUrl);

  const refundedOrders = await Order.find({ status: "refunded" }).select("_id userId").lean();
  let matched = 0;
  let modified = 0;

  for (const order of refundedOrders) {
    const items = await OrderItem.find({ orderId: order._id }).select("courseId").lean();
    const courseIds = [...new Map(items.map((item) => [String(item.courseId), item.courseId])).values()];
    if (courseIds.length === 0) continue;

    const filter = {
      userId: order.userId,
      courseId: { $in: courseIds },
      status: { $in: ["active", "completed"] },
    };
    const result = dryRun
      ? { matchedCount: await Enrollment.countDocuments(filter), modifiedCount: 0 }
      : await Enrollment.updateMany(filter, { $set: { status: "refunded" } });

    matched += result.matchedCount || 0;
    modified += result.modifiedCount || 0;
  }

  console.log(
    JSON.stringify({
      event: "migration.refunded_enrollments.completed",
      refundedOrders: refundedOrders.length,
      dryRun,
      matched,
      modified,
    })
  );
};

migrateRefundedEnrollments()
  .catch((error) => {
    console.error(
      JSON.stringify({
        event: "migration.refunded_enrollments.failed",
        error: { name: error.name, message: error.message, stack: error.stack },
      })
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
