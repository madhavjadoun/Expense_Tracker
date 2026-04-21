const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema({
  _id: { type: String },   // UUID from frontend (crypto.randomUUID)
  name: { type: String, required: true },
  owner: { type: String, required: true, index: true },
  members: [
    {
      userId: { type: String, required: true, index: true },
      role: {
        type: String,
        enum: ["owner", "admin", "member"],
        default: "member"
      }
    }
  ],
  createdAt: { type: Date, default: Date.now },
}, { _id: false }); // disable auto ObjectId generation


module.exports = mongoose.model("Workspace", workspaceSchema);
