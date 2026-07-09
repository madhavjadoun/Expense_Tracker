const express = require("express");
const { postSupportMessage } = require("../controllers/supportController");

const router = express.Router();

// POST /api/support
router.post("/", postSupportMessage);

module.exports = router;
