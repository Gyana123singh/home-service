const mongoose = require("mongoose");

const referralSettingsSchema = new mongoose.Schema(
  {
    rewardAmount: {
      type: Number,
      default: 150,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    minOrderAmount: {
      type: Number,
      default: 0, // optional condition
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReferralSettings", referralSettingsSchema);