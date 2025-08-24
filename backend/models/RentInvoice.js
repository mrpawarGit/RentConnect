const mongoose = require("mongoose");

const RentInvoiceSchema = new mongoose.Schema(
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
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },

    periodStart: { type: Date, required: true }, // inclusive
    periodEnd: { type: Date, required: true }, // inclusive
    dueDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["unpaid", "paid", "overdue", "delayed"],
      default: "unpaid",
    },
    notes: { type: String },

    // If tenant requests delay / landlord approves
    delayRequested: { type: Boolean, default: false },
    delayReason: { type: String },
    newDueDate: { type: Date }, // proposed or approved new due date
  },
  { timestamps: true }
);

RentInvoiceSchema.index({ tenant: 1, dueDate: 1 });

module.exports = mongoose.model("RentInvoice", RentInvoiceSchema);
