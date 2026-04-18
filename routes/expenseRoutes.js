const express = require("express");
const {
  addExpense,
  getAllExpenses,
  getSummary,
  deleteExpense,
  updateExpense,
} = require("../controllers/expenseController");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(requireAuth);

// POST /api/expenses/add
router.post("/add", requireRole(["owner", "admin", "member"]), addExpense);

// GET /api/expenses
router.get("/", requireRole(["owner", "admin", "member"]), getAllExpenses);

// GET /api/expenses/summary
router.get("/summary", requireRole(["owner", "admin", "member"]), getSummary);

// DELETE /api/expenses/:id
router.delete("/:id", requireRole(["owner", "admin", "member"]), deleteExpense);
// PUT /api/expenses/:id
router.put("/:id", requireRole(["owner", "admin", "member"]), updateExpense);

module.exports = router;
