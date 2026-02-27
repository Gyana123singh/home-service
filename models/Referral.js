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

    rewardAmount: {
      type: Number,
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    status: {
      type: String,
      enum: ["pending", "credited"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);