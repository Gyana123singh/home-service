const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, uppercase: true, required: true }, // HIRE50
    title: String,
    description: String,

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: { type: Number, required: true }, // 50 or 200
    maxDiscount: Number, // optional cap for %

    minOrderValue: { type: Number, default: 0 },

    applicableCategories: [String], // e.g. ["Cleaning", "Spa"]
    applicableServices: [
      { type: mongoose.Schema.Types.ObjectId, ref: "AdminService" },
    ], // optional

    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },

    perUserLimit: { type: Number, default: 1 },
    isFirstOrderOnly: { type: Boolean, default: false },

    expiresAt: Date,

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Coupon", couponSchema);