const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: [{ type: String }],

    // message receipts
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Add indexes for better performance
MessageSchema.index({ thread: 1, createdAt: -1 });
MessageSchema.index({ to: 1, readAt: 1 });

module.exports =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
