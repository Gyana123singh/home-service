// utils/razorpay.js
require("dotenv").config();
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

function verifyRazorpaySignature(payload, signature, secret) {
  if (!secret) return true;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}

async function createRazorpayCheckoutSession({
  amount,
  orderId,
  userId,
  description = "Home Service Booking",
  notes = {},
  callbackUrl,
}) {
  if (!razorpay) {
    throw new Error("Razorpay credentials are not configured");
  }
  const baseSuccessUrl = callbackUrl || process.env.FRONTEND_SUCCESS_URL;
  const cancelUrl = process.env.FRONTEND_CANCEL_URL;

  if (!baseSuccessUrl || !cancelUrl) {
    throw new Error(
      "FRONTEND_SUCCESS_URL or FRONTEND_CANCEL_URL is not defined in .env",
    );
  }

  const payload = {
    amount: Math.round(Number(amount) * 100),
    currency: "INR",
    description,
    reference_id: orderId.toString(),
    notify: {
      sms: true,
      email: false,
    },
    reminder_enable: true,
    notes: {
      orderId: orderId.toString(),
      userId: userId.toString(),
      ...notes,
    },
  };

  const isHttpUrl = (url) => /^https?:\/\//i.test(url);

  if (isHttpUrl(baseSuccessUrl)) {
    payload.callback_url = baseSuccessUrl;
    payload.callback_method = "get";
  }

  const paymentLink = await razorpay.paymentLink.create(payload);

  return {
    id: paymentLink.id,
    url: paymentLink.short_url || paymentLink.url,
    ...paymentLink,
  };
}

module.exports = {
  razorpay,
  verifyRazorpaySignature,
  createRazorpayCheckoutSession,
};
