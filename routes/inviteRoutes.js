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

// ── POST /api/invite/verify ───────────────────────────────────────────────────
// Protected — verifies JWT and adds user as member.
// MUST be declared before /:workspaceId so Express doesn't treat "verify" as a param.
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



module.exports = router;
