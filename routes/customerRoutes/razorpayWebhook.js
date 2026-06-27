const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

const { verifyRazorpaySignature } = require("../../utils/razorpay");

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
    const signature = req.headers["x-razorpay-signature"];
    const payload = req.body.toString("utf8");

    if (
      process.env.RAZORPAY_WEBHOOK_SECRET &&
      !verifyRazorpaySignature(
        payload,
        signature,
        process.env.RAZORPAY_WEBHOOK_SECRET,
      )
    ) {
      return res.status(400).send("Webhook Error: Invalid signature");
    }

    let event;

    try {
      event = JSON.parse(payload);
    } catch (err) {
      console.error("Webhook payload parse error:", err.message);
      return res.status(400).send("Webhook Error: Invalid payload");
    }

    try {
      const paymentEntity = event?.payload?.payment?.entity || {};
      const notes = paymentEntity.notes || {};
      const eventType = event?.event;

      if (eventType === "payment.captured" || eventType === "payment.authorized") {
        const payment = await Payment.findOne({
          $or: [
            { razorpayPaymentId: paymentEntity.id },
            { razorpayPaymentLinkId: paymentEntity.id },
          ],
        });

        if (notes.type === "vendor_subscription") {
          const { vendorId, planId } = notes;

          const vendor = await User.findById(vendorId);
          const plan = await SubscriptionPlan.findById(planId);

          if (!vendor || !plan) {
            return res.json({ received: true });
          }

          if (vendor.subscription?.razorpayPaymentLinkId === paymentEntity.id) {
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
            razorpayPaymentLinkId: paymentEntity.id,
          };

          await vendor.save();

          const existingPayment = await SubscriptionPayment.findOne({
            razorpayPaymentId: paymentEntity.id,
          });

          if (!existingPayment) {
            await SubscriptionPayment.create({
              vendor: vendor._id,
              plan: plan._id,
              amount: paymentEntity.amount ? paymentEntity.amount / 100 : plan.price,
              razorpayPaymentId: paymentEntity.id,
              razorpayPaymentLinkId: paymentEntity.id,
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

          return res.json({ received: true });
        }

        if (!payment) {
          const orderId = notes.orderId || notes.order_id;
          const order = orderId ? await Order.findById(orderId) : null;

          if (!order) {
            return res.json({ received: true });
          }

          const fallbackPayment = await Payment.findOne({ order: order._id });
          if (!fallbackPayment) {
            return res.json({ received: true });
          }

          payment = fallbackPayment;
        }

        if (payment && payment.status !== "initiated") {
          return res.json({ received: true });
        }

        if (payment) {
          payment.status = "held";
          payment.razorpayPaymentId = paymentEntity.id;
          await payment.save();

          const order = await Order.findById(payment.order);

          if (!order) {
            return res.json({ received: true });
          }

          order.paymentStatus = "paid";
          order.status = "confirmed";

          await order.save();

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
      console.error("RAZORPAY WEBHOOK HANDLER ERROR:", err);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  },
);

module.exports = router;
