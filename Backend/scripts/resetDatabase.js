const mongoose = require("mongoose");
const config = require("../config");
const models = require("../models");

async function resetDatabase() {
  await mongoose.connect(config.mongoUrl);

  const collections = Object.entries(models).filter(([, model]) => typeof model?.deleteMany === "function");
  for (const [name, model] of collections) {
    const result = await model.deleteMany({});
    console.log(`${name}: removed ${result.deletedCount} records`);
  }

  await mongoose.disconnect();
  console.log("Database reset completed");
}

resetDatabase().catch(async (error) => {
  console.error("Database reset failed:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
