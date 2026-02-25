// routes/customer/stripeWebhookRoutes.js
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { stripe } = require("../../utils/stripe");
const Payment = require("../../models/Payment");
const Order = require("../../models/Order");
const User = require("../../models/User");
const SubscriptionPlan = require("../../models/SubscriptionPlan");
const { getIO } = require("../../sockets/socket");

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const metadata = session.metadata || {};

        // ================================
        // ✅ CASE 1: VENDOR SUBSCRIPTION
        // ================================
        if (metadata.type === "vendor_subscription") {
          const { vendorId, planId } = metadata;

          const vendor = await User.findById(vendorId);
          const plan = await SubscriptionPlan.findById(planId);

          if (!vendor || !plan) {
            console.error("Vendor or Plan not found for subscription");
            return res.json({ received: true });
          }

          // 🛑 Idempotency guard: prevent double processing
          if (vendor.subscription?.stripeSessionId === session.id) {
            console.log(
              "⚠️ Subscription already processed for session:",
              session.id,
            );
            return res.json({ received: true });
          }

          const now = new Date();

          let startDate = now;
          let endDate = new Date(now);

          // ⏳ If already active, extend from existing end date
          if (
            vendor.subscription &&
            vendor.subscription.status === "active" &&
            vendor.subscription.endDate &&
            new Date(vendor.subscription.endDate) > now
          ) {
            startDate = vendor.subscription.startDate;
            endDate = new Date(vendor.subscription.endDate);
          }

          // 📅 Extend by plan duration (days)
          endDate.setDate(endDate.getDate() + plan.duration);

          vendor.subscription = {
            plan: plan._id,
            startDate,
            endDate,
            status: "active",
            stripeSessionId: session.id,
          };

          await vendor.save();

          console.log("✅ Vendor subscription activated/extended:", vendor._id);
        }

        // ================================
        // 🛒 CASE 2: CUSTOMER ORDER (YOUR EXISTING LOGIC)
        // ================================
        else {
          const payment = await Payment.findOne({
            stripeSessionId: session.id,
          });

          // Idempotency guard
          if (payment && payment.status === "initiated") {
            payment.status = "held";
            payment.stripePaymentIntentId = session.payment_intent;
            await payment.save();

            const order = await Order.findById(payment.order);
            if (order) {
              order.paymentStatus = "paid";
              order.status = "confirmed";
              await order.save();

              const io = getIO();
              io.to(`vendor:${payment.vendor}`).emit("order:update", order);
              io.to(`user:${payment.customer}`).emit("order:update", order);
              io.to("admin").emit("order:update", order);
            }
          }
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("STRIPE WEBHOOK HANDLER ERROR:", err);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  },
);

module.exports = router;
