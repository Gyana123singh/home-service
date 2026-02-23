const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    method: {
      type: String, // "UPI" | "BANK"
      enum: ["UPI", "BANK"],
      required: true,
    },

    upiId: String,

    bankDetails: {
      accountNumber: String,
      ifsc: String,
      accountHolderName: String,
      bankName: String,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },

    adminNote: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);