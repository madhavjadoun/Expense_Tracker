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

// ── GET /join/:token ───────────────────────────────────────────────────────────
// Serves an HTML page with OG meta tags for social preview.
// Bots/crawlers see the meta tags; real users are JS-redirected to the React app.
router.get("/join/:token", (req, res) => {
  const { token } = req.params;

  let expired = false;
  try {
    if (SECRET) jwt.verify(token, SECRET);
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
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Expense Tracker" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
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
// Generates a 2-day JWT invite link.
router.post("/:workspaceId", requireAuth, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: "workspaceId is required." });
    }

    if (!SECRET) {
      console.error("[INVITE] JWT_SECRET is not set.");
      return res.status(500).json({ success: false, message: "Server misconfiguration: JWT_SECRET missing." });
    }

    // Try to find workspace — if not in DB (local-only workspace), auto-create it as owner
    let workspace = null;
    try {
      workspace = await Workspace.findById(workspaceId);
    } catch (_) {
      // findById can throw on bad id format — treat as not found
      workspace = null;
    }

    if (!workspace) {
      // First time generating an invite for a local workspace → promote it to DB
      try {
        workspace = await Workspace.create({
          _id: workspaceId,
          name: "Shared Workspace",
          owner: req.userId,
          members: [{ userId: req.userId, role: "owner" }],
        });
      } catch (createErr) {
        // Duplicate key: another request created it between findById and create
        if (createErr.code === 11000) {
          workspace = await Workspace.findById(workspaceId);
        } else {
          throw createErr;
        }
      }
    } else {
      // Workspace exists — verify caller has invite rights
      const member = workspace.members.find((m) => m.userId === req.userId);
      if (!member || !["owner", "admin"].includes(member.role)) {
        return res.status(403).json({ success: false, message: "Only owner or admin can generate invite links." });
      }
    }

    const token = jwt.sign(
      { workspaceId, createdBy: req.userId },
      SECRET,
      { expiresIn: "2d" }
    );

    const inviteLink = `${BACKEND_URL}/join/${token}`;
    return res.status(200).json({ success: true, inviteLink });

  } catch (err) {
    console.error("[INVITE] Error generating invite:", err.message);
    return res.status(500).json({ success: false, message: "Failed to generate invite link." });
  }
});

// ── POST /api/invite/verify ───────────────────────────────────────────────────
// Protected — verifies JWT and adds user as member.
router.post("/verify", requireAuth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required." });
    }

    if (!SECRET) {
      return res.status(500).json({ success: false, message: "Server misconfiguration: JWT_SECRET missing." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (err) {
      const expired = err.name === "TokenExpiredError";
      return res.status(400).json({
        success: false,
        message: expired ? "Invite link has expired." : "Invalid invite link.",
      });
    }

    const { workspaceId } = decoded;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found. The owner may have deleted it." });
    }

    // Duplicate check
    const existing = workspace.members.find((m) => m.userId === req.userId);
    if (existing) {
      return res.status(200).json({
        success: true,
        workspaceId,
        role: existing.role,
        name: workspace.name,
        message: "Already a member.",
      });
    }

    // Add as member
    workspace.members.push({ userId: req.userId, role: "member" });
    await workspace.save();

    return res.status(200).json({
      success: true,
      workspaceId,
      role: "member",
      name: workspace.name,
    });

  } catch (err) {
    console.error("[VERIFY] Error:", err.message);
    return res.status(500).json({ success: false, message: "Server error during invite verification." });
  }
});

module.exports = router;
