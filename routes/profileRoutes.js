const express = require("express");
const { getProfile, putProfile } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", getProfile);
router.put("/", putProfile);

module.exports = router;
