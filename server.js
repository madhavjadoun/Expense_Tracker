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
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { initFirebaseAdmin } = require("./firebaseAdmin");
const { startRecurringCron } = require("./scripts/recurringCron");

// Load variables from .env into process.env
dotenv.config();

initFirebaseAdmin();

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.firebaseapp.com", "https://*.googleapis.com"],
      connectSrc: [
        "'self'", 
        "https://*.googleapis.com", 
        "https://*.firebaseapp.com", 
        "https://*.firebase.google.com", 
        "wss://*.firebaseio.com", 
        "https://*.vercel.app",
        "https://arthaa.live",
        "https://*.arthaa.live"
      ],
      imgSrc: ["'self'", "data:", "https://*.firebaseapp.com", "https://*.googleusercontent.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});
app.use("/api", limiter);

const allowedOrigins = [
  "http://localhost:5173",
  "https://madhav-expense-tracker.vercel.app",
  "https://arthaa.live",
  "https://www.arthaa.live"
];
if (process.env.CLIENT_ORIGIN) {
  allowedOrigins.push(process.env.CLIENT_ORIGIN);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) ||
      allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
      (origin.endsWith(".vercel.app") && origin.includes("madhav-expense-tracker")) ||
      origin.endsWith("arthaa.live");
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// Serve static files from client/public (preview.png, favicon, etc.)
const publicDir = path.join(__dirname, "client", "public");
app.use(express.static(publicDir));

// Serve the React frontend build
const distDir = path.join(__dirname, "client", "dist");
app.use(express.static(distDir));

// Health check (does not override React SPA)
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// API routes (all protected by requireAuth → req.userId)
const expenseRoutes = require("./routes/expenseRoutes");
const profileRoutes = require("./routes/profileRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const inviteRoutes = require("./routes/inviteRoutes");
const joinRoutes = require("./routes/joinRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const supportRoutes = require("./routes/supportRoutes");
const currencyRoutes = require("./routes/currencyRoutes");

// Public OG preview route — hit by WhatsApp / social crawlers
// GET /join/:token → serves OG meta HTML then redirects to React frontend
app.use("/join", joinRoutes);

// API routes
app.use("/api/expenses", expenseRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/currencies", currencyRoutes);

// Catch-all: serve React SPA for any unmatched route (handles /app/join/:token etc.)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

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

