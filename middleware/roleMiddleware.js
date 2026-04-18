const Workspace = require("../models/Workspace");

const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // workspaceId comes from params, body, or query
      const workspaceId =
        req.params.workspaceId ||
        req.body.workspaceId ||
        req.query.workspaceId;

      // No workspaceId provided → block
      if (!workspaceId) {
        return res.status(400).json({ success: false, message: "Workspace ID is required." });
      }

      // "default" is the personal workspace — local only, no DB record needed
      if (workspaceId === "default") {
        return next();
      }

      // Look up workspace by string _id (UUID)
      const workspace = await Workspace.findById(workspaceId).lean();

      // Workspace not in DB yet (e.g. legacy local workspace) → allow access
      // The workspace is implicitly owned by the authenticated user
      if (!workspace) {
        return next();
      }

      const member = workspace.members.find((m) => m.userId === req.userId);

      // Not a member → deny
      if (!member) {
        return res.status(403).json({ success: false, message: "Access denied. You are not a member of this workspace." });
      }

      // Wrong role → deny
      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions." });
      }

      req.workspace = workspace;
      req.userRole = member.role;
      next();
    } catch (err) {
      console.error("[RBAC Error]:", err.message);
      // CastError = bad ObjectId format (e.g. UUID passed to old ObjectId field)
      // Treat as "workspace not in DB" and allow through
      if (err.name === "CastError") {
        return next();
      }
      return res.status(500).json({ success: false, message: "Server error during permission check." });
    }
  };
};

module.exports = { requireRole };
