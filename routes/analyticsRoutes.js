const express = require("express");
const { getSummary } = require("../controllers/expenseController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

/** Same aggregation as GET /api/expenses/summary — scoped by userId in controller. */
router.get("/summary", getSummary);

module.exports = router;
