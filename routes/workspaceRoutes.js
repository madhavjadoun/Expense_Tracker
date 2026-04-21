const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const Workspace = require("../models/Workspace");
const Expense = require("../models/Expense");

const router = express.Router();

// ── GET /api/workspaces ────────────────────────────────────────────────────────
// Returns ONLY workspaces the authenticated user owns or is a member of.
// This is the primary data-isolation guard — never returns all workspaces.
router.get("/", requireAuth, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.userId },
        { "members.userId": req.userId },
      ],
    }).lean();

    // Normalize to the shape the frontend expects.
    const normalized = workspaces.map((ws) => {
      const memberEntry = ws.members?.find((m) => m.userId === req.userId);
      return {
        id:        ws._id,
        name:      ws.name,
        createdAt: ws.createdAt,
        role:      memberEntry?.role ?? "member",
      };
    });

    return res.status(200).json({ success: true, data: normalized });
  } catch (err) {
    console.error("[WS LIST]", err.message);
    return res.status(500).json({ success: false, message: "Error fetching workspaces." });
  }
});

// ── POST /api/workspaces ───────────────────────────────────────────────────────
// Creates a new workspace and sets the creator as owner.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, id } = req.body;
    if (!name || !id) {
      return res.status(400).json({ success: false, message: "Name and id required." });
    }

    // Upsert — if already created (e.g. from invite flow), return existing
    let workspace = await Workspace.findById(id);
    if (!workspace) {
      workspace = await Workspace.create({
        _id: id,
        name,
        owner: req.userId,
        members: [{ userId: req.userId, role: "owner" }],
      });
    }

    return res.status(200).json({ success: true, data: workspace });
  } catch (err) {
    console.error("[WS CREATE]", err.message);
    // Handle duplicate key gracefully
    if (err.code === 11000) {
      return res.status(200).json({ success: true, message: "Workspace already exists." });
    }
    return res.status(500).json({ success: false, message: "Error creating workspace.", error: err.message });
  }
});

// ── DELETE /api/workspaces/:workspaceId ───────────────────────────────────────
// Deletes workspace. Only the owner can do this.
router.delete("/:workspaceId", requireAuth, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Look up workspace — if not in DB it's a local-only workspace, allow delete locally
    let workspace = null;
    try {
      workspace = await Workspace.findById(workspaceId);
    } catch (_) {
      workspace = null;
    }

    if (workspace) {
      // Verify the caller is the owner
      if (workspace.owner !== req.userId) {
        return res.status(403).json({ success: false, message: "Only the owner can delete this workspace." });
      }
      await Workspace.findByIdAndDelete(workspaceId);
      await Expense.deleteMany({ workspaceId });
    }
    // If workspace not in DB — it was local-only, nothing to delete server-side

    return res.status(200).json({ success: true, message: "Workspace deleted." });
  } catch (err) {
    console.error("[WS DELETE]", err.message);
    return res.status(500).json({ success: false, message: "Error deleting workspace.", error: err.message });
  }
});

module.exports = router;
