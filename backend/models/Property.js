// models/Property.js

const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    title: String,
    address: String,
    description: String,
    rentAmount: Number,

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // landlord user
      required: true,
    },
    tenants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // tenant users living in this property
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", PropertySchema);
