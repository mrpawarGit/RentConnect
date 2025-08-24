// backend/models/Message.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    body: { type: String, trim: true },
    attachments: [{ type: String }],

    // message receipts
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
