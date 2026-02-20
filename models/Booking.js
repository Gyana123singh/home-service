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
    // models/Booking.js (ADD)

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

    // 🧩 Customer selections (from your UI: bedrooms, type, frequency, etc.)
    selections: [
      {
        label: String, // e.g. "Number of bedrooms"
        value: String, // e.g. "3BHK+"
        extraPrice: Number, // e.g. 1999
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

    // 📦 Quantity (if you ever allow multiple)
    quantity: {
      type: Number,
      default: 1,
    },

    // 📌 Booking status (matches your vendor UI)
    status: {
      type: String,
      enum: ["upcoming", "confirmed", "awaiting", "completed", "cancelled"],
      default: "upcoming",
    },

    // 💳 Payment info
    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "NET_BANKING", "COD"],
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
