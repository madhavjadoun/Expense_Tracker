const Workspace = require("../models/Workspace");

const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // workspaceId might come from params, body, or query
      const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

      if (!workspaceId) {
        // If workspaceId is not provided, allow if it's "default", else deny?
        // Let's assume if it's strictly absent, we should fail if the route expects RBAC.
        // Or if it's "default", allow it since the default dashboard is local isolation.
        return res.status(400).json({ success: false, message: "Workspace ID is required for access." });
      }

      if (workspaceId === "default") {
        // "default" is the local user-only workspace, no DB entry required.
        return next();
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ success: false, message: "Workspace not found." });
      }

      const member = workspace.members.find(
        (m) => m.userId === req.userId
      );

      if (!member || !allowedRoles.includes(member.role)) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions." });
      }

      // Attach workspace object to request for downstream use
      req.workspace = workspace;
      req.userRole = member.role;
      next();
    } catch (err) {
      console.error("[RBAC Error]:", err);
      return res.status(500).json({ success: false, message: "Server error during permission check." });
    }
  };
};

module.exports = { requireRole };
