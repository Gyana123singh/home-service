const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // 👤 Who booked
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🧑‍🔧 Who will serve
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔗 Linked order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    category: {
      type: String, // e.g. "Cleaning", "Electrical"
      required: true,
    },

    // 🛠️ Which service
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminService",
      required: true,
    },

    // 📅 Schedule
    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String, // e.g. "10:00 AM"
    },

    // 🧩 Customer selections
    selections: [
      {
        label: String,
        value: String,
        extraPrice: Number,
      },
    ],

    // 💰 Pricing
    basePrice: {
      type: Number,
      required: true,
    },

    addonsPrice: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    // 📦 Quantity
    quantity: {
      type: Number,
      default: 1,
    },

    // 📌 Booking status
    status: {
      type: String,
      enum: ["upcoming", "confirmed", "awaiting", "completed", "cancelled"],
      default: "upcoming",
    },

    // 💳 Payment info
    // ✅ FIX: Added "STRIPE" here
    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "NET_BANKING", "COD", "STRIPE"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);