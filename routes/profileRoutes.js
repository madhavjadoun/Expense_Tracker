const express = require("express");
const { getProfile, putProfile, deleteAccount } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", getProfile);
router.put("/", putProfile);

// Permanently delete the authenticated user's account and all associated data.
// Path is /me (not /:id) so it can never collide with a real userId segment.
router.delete("/me", deleteAccount);

module.exports = router;
