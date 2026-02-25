const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Basic, Pro, Business
    price: { type: Number, required: true }, // 0, 19, 49
    duration: { type: Number, default: 30 }, // days
    features: [{ type: String }],
    stripePriceId: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
