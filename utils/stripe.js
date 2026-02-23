// utils/stripe.js
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createStripeCheckoutSession({ amount, orderId, userId }) {
  const baseSuccessUrl = process.env.FRONTEND_SUCCESS_URL;
  const joinChar = baseSuccessUrl.includes("?") ? "&" : "?";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: "Home Service Booking",
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: orderId.toString(),
      userId: userId.toString(),
    },
    success_url: `${baseSuccessUrl}${joinChar}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.FRONTEND_CANCEL_URL,
  });

  return session;
}

module.exports = { stripe, createStripeCheckoutSession };