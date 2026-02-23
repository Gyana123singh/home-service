const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true },

    method: {
      type: String,
      enum: ["UPI", "CARD", "NET_BANKING", "COD"],
      required: true,
    },

    status: {
      type: String,
      enum: ["initiated", "held", "released", "failed", "refunded"],
      default: "initiated",
    },

    gateway: { type: String, default: "phonepe" },
    transactionId: String,
    phonepeMerchantTransactionId: String,

    releasedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);