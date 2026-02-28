const mongoose = require("mongoose");

const referralSettingsSchema = new mongoose.Schema(
  {
    rewardAmount: { type: Number, default: 150 },
    bonusForNewUser: { type: Number, default: 100 }, // ₹100 OFF
    minOrderAmount: { type: Number, default: 500 },
    expiryDays: { type: Number, default: 30 },
    monthlyLimit: { type: Number, default: 50 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReferralSettings", referralSettingsSchema);