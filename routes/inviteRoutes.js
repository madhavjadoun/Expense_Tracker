const express = require("express");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/requireAuth");
const Workspace = require("../models/Workspace");

const router = express.Router();

const SECRET = process.env.JWT_SECRET;

// Backend URL (this server) — used for the shareable /join/:token OG page
const BACKEND_URL =
  process.env.BACKEND_URL || "https://expense-tracker-rouge-chi-43.vercel.app";

// Frontend URL — where the React app is deployed
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "https://expense-tracker-rouge-chi-43.vercel.app";

// ── GET /api/invite/join/:token ───────────────────────────────────────────────
// Serves an HTML page with OG meta tags for social preview.
// Bots/crawlers see the meta tags; real users are JS-redirected to the React app.
router.get("/join/:token", (req, res) => {
  const { token } = req.params;

  // Verify token is valid before serving the page (graceful error if expired)
  let workspaceId = "";
  let expired = false;
  try {
    if (SECRET) {
      const decoded = jwt.verify(token, SECRET);
      workspaceId = decoded.workspaceId || "";
    }
  } catch (err) {
    expired = err.name === "TokenExpiredError";
  }

  const title = expired
    ? "Invite Expired — Expense Tracker"
    : "Join my workspace on Expense Tracker 🚀";
  const description = expired
    ? "This invite link has expired. Ask for a new one."
    : "You've been invited to collaborate and manage expenses together.";
  const redirectUrl = `${CLIENT_ORIGIN}/app/join/${token}`;
  const imageUrl = `${BACKEND_URL}/preview.png`;
  const canonicalUrl = `${BACKEND_URL}/join/${token}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Expense Tracker" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <!-- Redirect real users to the React app -->
  <script>window.location.replace("${redirectUrl}");</script>
</head>
<body style="background:#020617;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Redirecting to Expense Tracker...</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  return res.send(html);
});

// ── POST /api/invite/:workspaceId ─────────────────────────────────────────────
// Generates a 2-day JWT invite link. Returns the BACKEND URL so WhatsApp
// scrapes the backend OG route, not the React SPA.
router.post("/:workspaceId", requireAuth, async (req, res) => {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return res.status(400).json({ success: false, message: "workspaceId is required." });
  }

  // Soft backward-compatibility: If workspace doesn't exist, create it (owner)
  let workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    workspace = await Workspace.create({
      _id: workspaceId,
      name: "Workspace " + workspaceId.substring(0, 4),
      owner: req.userId,
      members: [{ userId: req.userId, role: "owner" }]
    });
  } else {
    // Check if user has owner or admin role
    const member = workspace.members.find(m => m.userId === req.userId);
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ success: false, message: "Only owner or admin can invite." });
    }
  }

  if (!SECRET) {
    console.error("[INVITE] JWT_SECRET is not set in environment.");
    return res.status(500).json({ success: false, message: "Server misconfiguration." });
  }

  try {
    const token = jwt.sign(
      { workspaceId, createdBy: req.userId },
      SECRET,
      { expiresIn: "2d" }
    );

    // Invite link points to the BACKEND's OG route
    const inviteLink = `${BACKEND_URL}/join/${token}`;

    return res.status(200).json({ success: true, inviteLink });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to generate invite link." });
  }
});

// ── POST /api/invite/verify ───────────────────────────────────────────────────
// Protected route — decodes the JWT and returns workspaceId. Requires authentication.
router.post("/verify", requireAuth, async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required." });
  }

  if (!SECRET) {
    return res.status(500).json({ success: false, message: "Server misconfiguration." });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    const workspaceId = decoded.workspaceId;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found." });
    }

    // Check duplicate
    const exists = workspace.members.find(m => m.userId === req.userId);
    if (exists) {
      // Already joined, simply return the workspace context
      return res.status(200).json({ success: true, workspaceId, role: exists.role, message: "Already joined" });
    }

    // Add user as member
    workspace.members.push({
      userId: req.userId,
      role: "member"
    });
    
    await workspace.save();

    return res.status(200).json({ success: true, workspaceId, role: "member", name: workspace.name });
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    return res.status(400).json({
      success: false,
      message: expired ? "Invite link has expired." : "Invalid invite link or token processing failed.",
    });
  }
});

module.exports = router;
