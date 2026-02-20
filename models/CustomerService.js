// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },

    date: Date,
    time: String,

    // 🧩 Customer selections
    selections: {
      bedrooms: {
        optionId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceOption" },
        label: String,
        extraPrice: Number,
      },
      cleaningType: {
        optionId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceOption" },
        label: String,
        extraPrice: Number,
      },
      frequency: {
        optionId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceOption" },
        label: String,
        extraPrice: Number,
      },
    },

    basePrice: Number,
    totalPrice: Number,

    status: {
      type: String,
      enum: ["upcoming", "confirmed", "awaiting", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerService", bookingSchema);
