const Expense = require("../models/Expense");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute the next run date from a base date.
 * Always works in UTC to avoid timezone drift.
 */
function computeNextRunDate(base, type) {
  const d = new Date(base);
  if (type === "weekly")  d.setUTCDate(d.getUTCDate() + 7);
  if (type === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

// ─── addExpense ───────────────────────────────────────────────────────────────
/**
 * POST /api/expenses/add
 */
async function addExpense(req, res) {
  try {
    const {
      amount, category, date, note,
      workspaceId,
      isRecurring, recurringType,
    } = req.body;

    // Validation
    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({ success: false, message: "Amount is required." });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required." });
    }
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number." });
    }

    // Recurring fields
    let nextRunDate = null;
    if (isRecurring && recurringType) {
      const baseDate = date ? new Date(date) : new Date();
      nextRunDate = computeNextRunDate(baseDate, recurringType);
    }

    const expense = await Expense.create({
      userId:       req.userId,
      workspaceId:  workspaceId || "default",
      amount:       numericAmount,
      category,
      date,
      note,
      isRecurring:    Boolean(isRecurring),
      recurringType:  isRecurring ? recurringType : null,
      nextRunDate,
    });

    return res.status(200).json({
      success: true,
      message: "Expense added successfully.",
      data: expense,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while adding expense.",
      error: err.message,
    });
  }
}

// ─── getAllExpenses ───────────────────────────────────────────────────────────
/**
 * GET /api/expenses
 * Supports optional ?workspaceId= query param.
 * Uses .lean() to skip Mongoose document hydration — plain JS objects are
 * faster to serialize and consume less memory.
 * Caps results at 500 to prevent large payloads on unbounded collections.
 */
async function getAllExpenses(req, res) {
  try {
    const { workspaceId } = req.query;
    const filter = { userId: req.userId };
    if (workspaceId) filter.workspaceId = workspaceId;

    const LIMIT = 500;
    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .limit(LIMIT)
      .lean();

    return res.status(200).json({
      success: true,
      count: expenses.length,
      truncated: expenses.length === LIMIT, // hint to client: there may be more
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

// ─── getSummary ───────────────────────────────────────────────────────────────
/**
 * GET /api/expenses/summary
 * Supports optional ?workspaceId= query param.
 */
async function getSummary(req, res) {
  try {
    const { workspaceId } = req.query;
    const matchStage = { userId: req.userId };
    if (workspaceId) matchStage.workspaceId = workspaceId;

    const grouped = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]);

    const categoryTotals = grouped.reduce((acc, row) => {
      acc[row._id] = row.total;
      return acc;
    }, {});

    const totalExpense = grouped.reduce((sum, row) => sum + row.total, 0);

    return res.status(200).json({
      success: true,
      data: { totalExpense, categoryTotals },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while generating summary.",
      error: err.message,
    });
  }
}

// ─── deleteExpense ────────────────────────────────────────────────────────────
async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Expense id is required." });

    const deleted = await Expense.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deleted) return res.status(404).json({ success: false, message: "Expense not found." });

    return res.status(200).json({ success: true, message: "Expense deleted.", data: deleted });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
}

// ─── updateExpense ────────────────────────────────────────────────────────────
async function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const { amount, category, date, note, isRecurring, recurringType } = req.body;

    if (!id) return res.status(400).json({ success: false, message: "Expense id is required." });

    const updates = {};
    if (amount !== undefined) {
      const n = Number(amount);
      if (Number.isNaN(n) || n <= 0)
        return res.status(400).json({ success: false, message: "Amount must be a positive number." });
      updates.amount = n;
    }
    if (category   !== undefined) updates.category = category;
    if (date       !== undefined) updates.date = date;
    if (note       !== undefined) updates.note = note;
    if (isRecurring !== undefined) {
      updates.isRecurring   = Boolean(isRecurring);
      updates.recurringType = isRecurring ? (recurringType || null) : null;
      // Recompute nextRunDate
      if (isRecurring && recurringType) {
        const base = date ? new Date(date) : new Date();
        updates.nextRunDate = computeNextRunDate(base, recurringType);
      } else {
        updates.nextRunDate = null;
      }
    }

    const updated = await Expense.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Expense not found." });

    return res.status(200).json({ success: true, message: "Expense updated.", data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
}

module.exports = { addExpense, getAllExpenses, getSummary, deleteExpense, updateExpense };
