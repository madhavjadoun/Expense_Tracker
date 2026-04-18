const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  members: [
    {
      userId: { type: String, required: true },
      role: {
        type: String,
        enum: ["owner", "admin", "member"],
        default: "member"
      }
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Workspace", workspaceSchema);
