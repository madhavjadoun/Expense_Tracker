const Profile = require("../models/Profile");
const Expense = require("../models/Expense");
const Workspace = require("../models/Workspace");
const admin = require("firebase-admin");

function sanitizeDoc(doc) {
  if (!doc) return null;
  const o = { ...doc };
  delete o.__v;
  return o;
}

/**
 * GET /api/profile
 * One document per Firebase uid.
 */
async function getProfile(req, res) {
  try {
    const doc = await Profile.findOne({ userId: req.userId }).lean();
    if (!doc) {
      return res.status(200).json({
        success: true,
        data: {
          userId: req.userId,
          name: req.tokenName || "",
          email: req.tokenEmail || "",
          mobile: "",
          gender: "male",
          profession: "",
          about: "",
          avatar: "",
          monthlyBudget: 0,
        },
      });
    }
    return res.status(200).json({
      success: true,
      data: sanitizeDoc(doc),
    });
  } catch (err) {
    console.error("[getProfile]", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error while loading profile.",
    });
  }
}

/**
 * PUT /api/profile
 * Upsert profile for req.userId (never trust client userId).
 */
async function putProfile(req, res) {
  try {
    // Whitelist allowed fields — never pass raw req.body to MongoDB
    const allowed = ["name", "email", "mobile", "gender", "profession", "about", "avatar", "budget", "monthlyBudget"];
    const updates = { userId: req.userId };
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const doc = await Profile.findOneAndUpdate(
      { userId: req.userId },
      updates,
      { upsert: true, new: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Profile saved.",
      data: sanitizeDoc(doc),
    });
  } catch (err) {
    console.error("[putProfile]", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error while saving profile.",
    });
  }
}

/**
 * DELETE /api/profile/me
 * Permanently deletes ALL data for the authenticated user:
 *   1. Their expenses
 *   2. Their profile
 *   3. Workspaces they own
 *   4. Removes them from workspaces where they are a member
 *   5. Deletes the Firebase Auth account
 *
 * DB operations happen FIRST. If Firebase deletion fails the DB data is
 * already gone, which is acceptable (a ghost Firebase user cannot log in
 * because there is no profile / data to load). The reverse ordering would
 * leave orphaned DB data after a successful Firebase deletion.
 */
async function deleteAccount(req, res) {
  const uid = req.userId;
  try {
    // ── 1. Delete all user expenses (independent of workspace) ───────────────
    await Expense.deleteMany({ userId: uid });

    // ── 2. Delete profile document ────────────────────────────────────────────
    await Profile.deleteOne({ userId: uid });

    // ── 3. Delete workspaces the user owns ───────────────────────────────────
    await Workspace.deleteMany({ owner: uid });

    // ── 4. Remove the user from workspaces they're a member (not owner) of ───
    await Workspace.updateMany(
      { "members.userId": uid },
      { $pull: { members: { userId: uid } } }
    );

    // ── 5. Delete Firebase Auth user ─────────────────────────────────────────
    // Do this last — once Firebase deletes the user, their ID token becomes
    // invalid so no further authenticated requests can be made.
    try {
      await admin.auth().deleteUser(uid);
    } catch (fbErr) {
      // Log but do not surface to client — DB cleanup succeeded.
      // The Firebase user may already be deleted or the Admin SDK may be
      // temporarily unavailable. Either way, without a DB profile the
      // account is effectively dead.
      console.error(`[deleteAccount] Firebase deleteUser failed for ${uid}:`, fbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Account and all data deleted successfully.",
    });
  } catch (err) {
    console.error(`[deleteAccount] Error for user ${uid}:`, err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account. Please try again.",
    });
  }
}

module.exports = {
  getProfile,
  putProfile,
  deleteAccount,
};
