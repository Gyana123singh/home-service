const mongoose = require("mongoose");
const SubscriptionPlan = require("../../models/SubscriptionPlan");
const User = require("../../models/User");
const { createRazorpayCheckoutSession } = require("../../utils/razorpay");
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

    console.log("👉 Using Razorpay plan reference:", plan.stripePriceId); // debug

    // ✅ USE VENDOR URLs (not customer ones)
    const baseSuccess = process.env.VENDOR_SUCCESS_URL; // e.g. hirehandprovider://auth?result=success
    const baseCancel = process.env.VENDOR_CANCEL_URL;

    if (!baseSuccess || !baseCancel) {
      throw new Error("VENDOR_SUCCESS_URL or VENDOR_CANCEL_URL is not set in .env");
    }

    const uniqueOrderId = new mongoose.Types.ObjectId();

    const session = await createRazorpayCheckoutSession({
      amount: plan.price,
      orderId: uniqueOrderId,
      userId: vendorId,
      description: `Subscription: ${plan.name}`,
      notes: {
        type: "vendor_subscription",
        vendorId: vendorId.toString(),
        planId: plan._id.toString(),
      },
      callbackUrl: baseSuccess,
    });

    res.json({ success: true, url: session.url, razorpayPaymentLinkId: session.id });
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
