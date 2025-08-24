// backend/models/Thread.js
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

    lastMessageAt: { type: Date, default: null },

    // unread counters for each side
    unreadForTenant: { type: Number, default: 0 },
    unreadForLandlord: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// increase unread count for recipient
ThreadSchema.statics.bumpUnread = async function (threadId, receiverRole) {
  const incField =
    receiverRole === "tenant" ? "unreadForTenant" : "unreadForLandlord";
  await this.findByIdAndUpdate(threadId, {
    $inc: { [incField]: 1 },
    $set: { lastMessageAt: new Date() },
  });
};

// clear unread when user opens thread
ThreadSchema.statics.clearUnread = async function (threadId, viewerRole) {
  const setField =
    viewerRole === "tenant" ? "unreadForTenant" : "unreadForLandlord";
  await this.findByIdAndUpdate(threadId, { $set: { [setField]: 0 } });
};

module.exports =
  mongoose.models.Thread || mongoose.model("Thread", ThreadSchema);
