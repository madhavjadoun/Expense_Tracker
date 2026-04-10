const mongoose = require("mongoose");

/**
 * Expense model
 * - `timestamps: true` automatically adds `createdAt` and `updatedAt`
 */
const expenseSchema = new mongoose.Schema(
  {
    /** Firebase Auth uid — scopes expenses per user */
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["food", "travel", "shopping", "other"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);

