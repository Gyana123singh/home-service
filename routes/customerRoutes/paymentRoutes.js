const express = require("express");
const router = express.Router();
const Payment = require("../../models/Payment");
const Order = require("../../models/Order");

router.post("/phonepe/callback", async (req, res) => {
  try {
    const { merchantTransactionId, state, transactionId } = req.body;

    const payment = await Payment.findOne({
      phonepeMerchantTransactionId: merchantTransactionId,
    });

    if (!payment) return res.status(404).send("Payment not found");

    if (state === "COMPLETED") {
      payment.status = "held"; // 🔒 money in escrow
      payment.transactionId = transactionId;
      await payment.save();

      const order = await Order.findById(payment.order);
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.transactionId = transactionId;
      await order.save();

      return res.send("Payment Successful. You can close this page.");
    } else {
      payment.status = "failed";
      await payment.save();
      return res.send("Payment Failed");
    }
  } catch (err) {
    console.error("PhonePe callback error:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
