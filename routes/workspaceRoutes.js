const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/roleMiddleware");
const Workspace = require("../models/Workspace");
const Expense = require("../models/Expense");

const router = express.Router();

// ── POST /api/workspaces ───────────────────────────────────────────────────────
// Creates a new workspace and sets the creator as owner.
router.post("/", requireAuth, async (req, res) => {
  const { name, id } = req.body;
  if (!name || !id) return res.status(400).json({ success: false, message: "Name and id required." });

  try {
    const workspace = await Workspace.create({
      _id: id, // Syncing MongoDB ObjectId/String directly with frontend's UUID
      name,
      owner: req.userId,
      members: [{ userId: req.userId, role: "owner" }]
    });

    return res.status(200).json({ success: true, data: workspace });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error creating workspace", error: err.message });
  }
});

// ── DELETE /api/workspaces/:workspaceId ───────────────────────────────────────
// Deletes workspace. Only allowed if owner.
router.delete("/:workspaceId", requireAuth, requireRole(["owner"]), async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // We can assume req.workspace exists because of requireRole
    if (req.workspace.owner !== req.userId) {
       return res.status(403).json({ success: false, message: "Only owner can delete workspace" });
    }

    await Workspace.findByIdAndDelete(workspaceId);
    await Expense.deleteMany({ workspaceId }); // clean up expenses

    return res.status(200).json({ success: true, message: "Workspace deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error deleting workspace", error: err.message });
  }
});

module.exports = router;
