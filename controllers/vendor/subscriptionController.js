const SubscriptionPlan = require("../../models/SubscriptionPlan");
const User = require("../../models/User");
const { stripe } = require("../../utils/stripe");
const SubscriptionPayment = require("../../models/SubscriptionPayment");

// 📄 Get active plans
exports.getActivePlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({
      price: 1,
    });

    res.json({ success: true, data: plans });
  } catch (err) {
    console.error("GET ACTIVE PLANS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to load plans" });
  }
};

// 📄 Get my current subscription
exports.getMySubscription = async (req, res) => {
  try {
    const vendor = await User.findById(req.user._id).populate(
      "subscription.plan",
    );

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    res.json({
      success: true,
      data: vendor.subscription || { status: "none" },
    });
  } catch (err) {
    console.error("GET MY SUBSCRIPTION ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to get subscription" });
  }
};

exports.createVendorSubscriptionCheckout = async (req, res) => {
  try {
    const { planId } = req.body;
    const vendorId = req.user._id;

    if (!planId) {
      return res
        .status(400)
        .json({ success: false, message: "planId is required" });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found or inactive" });
    }

    console.log("👉 Using Stripe price:", plan.stripePriceId); // debug

    const baseSuccess = process.env.FRONTEND_SUCCESS_URL; // e.g. hirehand://auth?result=success
    const baseCancel = process.env.FRONTEND_CANCEL_URL;

    // 🔧 If baseSuccess already has ?, append with &, else use ?
    const joinChar = baseSuccess.includes("?") ? "&" : "?";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // ✅ MUST be subscription for recurring price
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId, // must be price_... (recurring)
          quantity: 1,
        },
      ],
      metadata: {
        type: "vendor_subscription",
        vendorId: vendorId.toString(),
        planId: plan._id.toString(),
      },
      success_url: `${baseSuccess}${joinChar}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: baseCancel,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error("❌ VENDOR SUB CHECKOUT ERROR FULL:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create checkout session" });
  }
};

// controllers/vendor/subscriptionController.js

exports.getMySubscriptionPayments = async (req, res) => {
  try {
    const payments = await SubscriptionPayment.find({
      vendor: req.user._id,
    })
      .populate("plan", "name price")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: payments });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load payments" });
  }
};
