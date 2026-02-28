const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    rewardAmount: {
      type: Number,
      required: true,
    },

    bonusToNewUser: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "credited", "expired"],
      default: "pending",
    },

    expiresAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);