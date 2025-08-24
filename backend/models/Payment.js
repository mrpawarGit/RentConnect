const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentInvoice",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, default: "manual" }, // "manual" placeholder (cash/bank)
    paidAt: { type: Date, default: Date.now },
    note: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ tenant: 1, paidAt: -1 });

module.exports = mongoose.model("Payment", PaymentSchema);
