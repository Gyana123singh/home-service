const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

const { stripe } = require("../../utils/stripe");

const Payment = require("../../models/Payment");
const Order = require("../../models/Order");
const Booking = require("../../models/Booking");

const User = require("../../models/User");
const SubscriptionPlan = require("../../models/SubscriptionPlan");
const SubscriptionPayment = require("../../models/SubscriptionPayment");

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

        // =========================================
        // VENDOR SUBSCRIPTION PAYMENT
        // =========================================

        if (metadata.type === "vendor_subscription") {
          const { vendorId, planId } = metadata;

          const vendor = await User.findById(vendorId);
          const plan = await SubscriptionPlan.findById(planId);

          if (!vendor || !plan) {
            return res.json({ received: true });
          }

          if (vendor.subscription?.stripeSessionId === session.id) {
            return res.json({ received: true });
          }

          const now = new Date();
          let startDate = now;
          let endDate = new Date(now);

          if (
            vendor.subscription &&
            vendor.subscription.status === "active" &&
            vendor.subscription.endDate &&
            new Date(vendor.subscription.endDate) > now
          ) {
            startDate = vendor.subscription.startDate;
            endDate = new Date(vendor.subscription.endDate);
          }

          endDate.setDate(endDate.getDate() + plan.duration);

          vendor.subscription = {
            plan: plan._id,
            startDate,
            endDate,
            status: "active",
            stripeSessionId: session.id,
          };

          await vendor.save();

          const existingPayment = await SubscriptionPayment.findOne({
            stripeSessionId: session.id,
          });

          if (!existingPayment) {
            await SubscriptionPayment.create({
              vendor: vendor._id,
              plan: plan._id,
              amount: session.amount_total
                ? session.amount_total / 100
                : plan.price,
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              status: "paid",
            });
          }

          try {
            const io = getIO();

            io.to(`vendor:${vendor._id}`).emit("subscription:update", {
              status: "active",
              plan: plan.name,
              endDate,
            });
          } catch (e) {
            console.warn("Socket emit failed:", e.message);
          }
        }

        // =========================================
        // CUSTOMER SERVICE ORDER PAYMENT
        // =========================================
        else {
          const payment = await Payment.findOne({
            stripeSessionId: session.id,
          });

          if (!payment) {
            console.log("Payment not found");
            return res.json({ received: true });
          }

          // Prevent duplicate webhook processing
          if (payment.status !== "initiated") {
            return res.json({ received: true });
          }

          payment.status = "held";
          payment.stripePaymentIntentId = session.payment_intent;

          await payment.save();

          const order = await Order.findById(payment.order);

          if (!order) {
            return res.json({ received: true });
          }

          order.paymentStatus = "paid";
          order.status = "confirmed";

          await order.save();

          // ======================================
          // CREATE BOOKINGS (supports multi-service)
          // ======================================

          for (const item of order.items) {
            const existingBooking = await Booking.findOne({
              order: order._id,
              service: item.service,
            });

            if (!existingBooking) {
              await Booking.create({
                order: order._id,
                customer: order.customer,
                vendor: order.vendor,

                category: "Service",

                service: item.service,
                selections: item.selections,

                date: item.date,
                time: item.time || null,

                basePrice: item.basePrice || 0,
                addonsPrice: item.addonsPrice || 0,

                totalPrice: item.totalPrice,
                quantity: item.quantity,

                paymentMethod: order.paymentMethod,
                paymentStatus: "paid",
                status: "awaiting",
              });
            }
          }

          try {
            const io = getIO();

            io.to(`vendor:${payment.vendor}`).emit("booking:new", order);
            io.to(`user:${payment.customer}`).emit("booking:new", order);
            io.to("admin").emit("booking:new", order);

            io.to(`vendor:${payment.vendor}`).emit("order:update", order);
            io.to(`user:${payment.customer}`).emit("order:update", order);
            io.to("admin").emit("order:update", order);
          } catch (e) {
            console.warn("Socket emit error:", e.message);
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
