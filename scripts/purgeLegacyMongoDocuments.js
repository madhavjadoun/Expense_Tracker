/**
 * One-time cleanup: remove documents missing userId (pre–multi-tenant data).
 * Run from project root: node scripts/purgeLegacyMongoDocuments.js
 * Requires MONGO_URI in .env
 */
require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(uri);

  const expenseResult = await mongoose.connection.db.collection("expenses").deleteMany({
    $or: [{ userId: { $exists: false } }, { userId: null }, { userId: "" }],
  });
  console.log("Deleted expenses without userId:", expenseResult.deletedCount);

  const profileResult = await mongoose.connection.db.collection("profiles").deleteMany({
    $or: [{ userId: { $exists: false } }, { userId: null }, { userId: "" }],
  });
  console.log("Deleted profiles without userId:", profileResult.deletedCount);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
