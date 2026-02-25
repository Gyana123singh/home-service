const SubscriptionPlan = require("../../models/SubscriptionPlan");
const SubscriptionPayment = require("../../models/SubscriptionPayment");

// ➕ Create Plan
exports.createPlan = async (req, res) => {
  try {
    const { name, price, duration, features, isPopular, stripePriceId } =
      req.body;
    if (!name || !price || !stripePriceId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const plan = await SubscriptionPlan.create({
      name,
      price,
      duration,
      features,
      stripePriceId, // ✅ IMPORTANT
      isPopular: isPopular || false,
    });

    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📄 Get All Plans (Admin)
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✏️ Update Plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ❌ Delete Plan
exports.deletePlan = async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Plan deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// controllers/admin/subscriptionPaymentController.js

exports.getAllSubscriptionPayments = async (req, res) => {
  try {
    const payments = await SubscriptionPayment.find()
      .populate("vendor", "name email")
      .populate("plan", "name price")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: payments });
  } catch (err) {
    console.error("GET SUB PAYMENTS ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load payments" });
  }
};

// POST /api/vendor/subscription/cancel
exports.cancelMySubscription = async (req, res) => {
  try {
    const vendor = await User.findById(req.user._id);

    if (!vendor || !vendor.subscription) {
      return res.json({ success: true, message: "No active subscription" });
    }

    vendor.subscription.status = "expired";
    vendor.subscription.endDate = new Date();
    await vendor.save();

    res.json({ success: true, message: "Subscription cancelled" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to cancel subscription" });
  }
};
