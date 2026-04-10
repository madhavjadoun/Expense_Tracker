const Profile = require("../models/Profile");

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
    return res.status(500).json({
      success: false,
      message: "Server error while loading profile.",
      error: err.message,
    });
  }
}

/**
 * PUT /api/profile
 * Upsert profile for req.userId (never trust client userId).
 */
async function putProfile(req, res) {
  try {
    // Ensure userId is stored in every profile document securely from the verified token
    req.body.userId = req.userId;

    const doc = await Profile.findOneAndUpdate(
      { userId: req.userId },
      req.body,
      { upsert: true, new: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Profile saved.",
      data: sanitizeDoc(doc),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while saving profile.",
      error: err.message,
    });
  }
}

module.exports = {
  getProfile,
  putProfile,
};
