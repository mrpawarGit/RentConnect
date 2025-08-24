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
    lastMessage: { type: String, default: "" }, // Store last message text for preview

    // unread counters for each side
    unreadForTenant: { type: Number, default: 0 },
    unreadForLandlord: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Add compound index for unique tenant-landlord pairs
ThreadSchema.index({ tenant: 1, landlord: 1 }, { unique: true });
ThreadSchema.index({ tenant: 1 });
ThreadSchema.index({ landlord: 1 });

// increase unread count for recipient
ThreadSchema.statics.bumpUnread = async function (
  threadId,
  receiverRole,
  messageText = ""
) {
  const incField =
    receiverRole === "tenant" ? "unreadForTenant" : "unreadForLandlord";
  await this.findByIdAndUpdate(threadId, {
    $inc: { [incField]: 1 },
    $set: {
      lastMessageAt: new Date(),
      lastMessage: messageText.substring(0, 100), // Store preview
    },
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
