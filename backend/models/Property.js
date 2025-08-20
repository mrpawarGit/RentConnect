const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String },
    rentAmount: { type: Number, required: true },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of tenant IDs
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", PropertySchema);
