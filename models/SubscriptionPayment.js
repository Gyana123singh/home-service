// models/SubscriptionPayment.js
const mongoose = require("mongoose");

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    amount: Number,
    stripeSessionId: String,
    stripePaymentIntentId: String,
    razorpayPaymentId: String,
    razorpayPaymentLinkId: String,
    status: {
      type: String,
      enum: ["paid", "failed"],
      default: "paid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);