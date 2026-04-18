/**
 * Expense Tracker Backend (Node.js + Express + MongoDB)
 *
 * Beginner-friendly notes:
 * - We use `dotenv` to read environment variables from `.env`
 * - `cors()` allows your frontend (different origin) to call this API
 * - `express.json()` lets Express read JSON bodies (POST/PUT/PATCH)
 * - We connect to MongoDB with Mongoose using process.env.MONGO_URI
 */

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const { initFirebaseAdmin } = require("./firebaseAdmin");
const { startRecurringCron } = require("./scripts/recurringCron");

// Load variables from .env into process.env
dotenv.config();

initFirebaseAdmin();

const app = express();

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json());

// Serve static files from client/public (preview.png, favicon, etc.)
const publicDir = path.join(__dirname, "client", "public");
app.use(express.static(publicDir));

// Test route (Requirement #5)
app.get("/", (req, res) => {
  res.send("API is running...");
});

// API routes (all protected by requireAuth → req.userId)
const expenseRoutes  = require("./routes/expenseRoutes");
const profileRoutes  = require("./routes/profileRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const inviteRoutes   = require("./routes/inviteRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");

// Public OG preview route — hit by WhatsApp / social crawlers
// GET /join/:token → serves OG meta HTML then redirects to React frontend
app.use("/join", inviteRoutes);

// API routes
app.use("/api/expenses", expenseRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/workspaces", workspaceRoutes);

// MongoDB connection (Requirement #2)
async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("❌ MONGODB ERROR: Missing MONGO_URI in environment. Please add it to your .env file.");
    process.exit(1);
  }

  try {
    console.log("⏳ Attempting to connect to MongoDB...");
    // Mongoose connection
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB successfully connected!");
    
    // Set up connection event listeners for better debugging
    mongoose.connection.on('error', (err) => {
      console.error("❌ MongoDB connection error after initial connection:", err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });

  } catch (err) {
    console.error("❌ MONGODB CONNECTION ERROR:");
    console.error(`- Error Message: ${err.message}`);
    console.error(`- Error Code: ${err.code || 'N/A'}`);
    console.error(`- Error Name: ${err.name}`);
    console.error("Please verify your IP whitelist, database credentials, and network connection.");
    process.exit(1);
  }
}

// Start server (Requirement #1)
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start cron AFTER DB is connected
    try { startRecurringCron(); } catch (e) {
      console.warn("[CRON] node-cron not installed — skipping recurring job. Run: npm install node-cron");
    }
  });
});

