const mongoose = require("mongoose");

const MaintenanceRequestSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    category: {
      type: String,
      enum: ["plumbing", "electrical", "hvac", "appliances", "general"],
      required: true,
    },
    urgency: { type: String, enum: ["low", "medium", "high"], default: "low" },
    description: { type: String, required: true },
    attachments: [{ type: String }], // file paths
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    timeline: [
      {
        at: { type: Date, default: Date.now },
        action: {
          type: String,
          enum: [
            "created",
            "reviewed",
            "scheduled",
            "in_progress",
            "resolved",
            "comment",
          ],
          required: true,
        },
        note: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceRequest", MaintenanceRequestSchema);
