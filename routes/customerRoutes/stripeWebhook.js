// routes/customer/stripeWebhookRoutes.js
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { stripe } = require("../../utils/stripe");
const Payment = require("../../models/Payment");
const Order = require("../../models/Order");
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
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

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

    res.json({ received: true });
  }
);

module.exports = router;