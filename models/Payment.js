// models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true },

    method: {
      type: String,
      enum: ["UPI", "CARD", "NET_BANKING", "COD", "STRIPE", "RAZORPAY"],
      required: true,
    },

    status: {
      type: String,
      enum: ["initiated", "held", "released", "failed", "refunded"],
      default: "initiated",
    },

    gateway: { type: String, default: "razorpay" },

    stripePaymentIntentId: String,
    stripeSessionId: String,
    razorpayPaymentId: String,
    razorpayPaymentLinkId: String,

    releasedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);