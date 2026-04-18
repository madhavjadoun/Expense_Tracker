const express = require("express");
const {
  addExpense,
  getAllExpenses,
  getSummary,
  deleteExpense,
  updateExpense,
} = require("../controllers/expenseController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

// POST /api/expenses/add
router.post("/add", addExpense);

// GET /api/expenses
router.get("/", getAllExpenses);

// GET /api/expenses/summary
router.get("/summary", getSummary);

// DELETE /api/expenses/:id
router.delete("/:id", deleteExpense);

// PUT /api/expenses/:id
router.put("/:id", updateExpense);

module.exports = router;
