const Expense = require("../models/Expense");

/**
 * POST /api/expenses/add
 * Add a new expense.
 */
async function addExpense(req, res) {
  try {
    const { amount, category, date, note } = req.body;

    // Basic validation (required fields)
    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        success: false,
        message: "Amount is required.",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    // Optional: a little extra validation for better API behavior
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a number.",
      });
    }

    if (numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0.",
      });
    }

    const expense = await Expense.create({
      userId: req.userId,
      amount: numericAmount,
      category,
      date,
      note,
    });

    return res.status(200).json({
      success: true,
      message: "Expense added successfully.",
      data: expense,
    });
  } catch (err) {
    // Mongoose validation errors come here too (like enum mismatch)
    return res.status(500).json({
      success: false,
      message: "Server error while adding expense.",
      error: err.message,
    });
  }
}

/**
 * GET /api/expenses
 * Get all expenses (latest first).
 */
async function getAllExpenses(req, res) {
  try {
    const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching expenses.",
      error: err.message,
    });
  }
}

/**
 * GET /api/expenses/summary
 * Summary:
 * - total expense
 * - category-wise totals (MongoDB aggregation)
 */
async function getSummary(req, res) {
  try {
    // Group expenses by category and sum amounts
    const grouped = await Expense.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const categoryTotals = grouped.reduce((acc, row) => {
      acc[row._id] = row.total;
      return acc;
    }, {});

    const totalExpense = grouped.reduce((sum, row) => sum + row.total, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalExpense,
        categoryTotals,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while generating summary.",
      error: err.message,
    });
  }
}

/**
 * DELETE /api/expenses/:id
 * Delete an expense by id.
 */
async function deleteExpense(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense id is required.",
      });
    }

    const deleted = await Expense.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully.",
      data: deleted,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while deleting expense.",
      error: err.message,
    });
  }
}

/**
 * PUT /api/expenses/:id
 * Update an existing expense by id.
 */
async function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const { amount, category, date, note } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense id is required.",
      });
    }

    const updates = {};
    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a valid number greater than 0.",
        });
      }
      updates.amount = numericAmount;
    }
    if (category !== undefined) updates.category = category;
    if (date !== undefined) updates.date = date;
    if (note !== undefined) updates.note = note;

    const updated = await Expense.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully.",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while updating expense.",
      error: err.message,
    });
  }
}

module.exports = {
  addExpense,
  getAllExpenses,
  getSummary,
  deleteExpense,
  updateExpense,
};

