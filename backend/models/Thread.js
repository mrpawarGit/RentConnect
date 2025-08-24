const mongoose = require("mongoose");

const ThreadSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    lastMessageAt: { type: Date },
    lastMessagePreview: { type: String },
    unreadForTenant: { type: Number, default: 0 },
    unreadForLandlord: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ThreadSchema.index(
  { tenant: 1, landlord: 1, property: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Thread", ThreadSchema);
