const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    mobile: { type: String, default: "" },
    gender: { type: String, default: "male" },
    profession: { type: String, default: "" },
    about: { type: String, default: "" },
    avatar: { type: String, default: "" },
    budget: { type: Number, default: 0 },
    monthlyBudget: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
