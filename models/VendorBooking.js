const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },

    date: Date,
    time: String,
    price: Number,

    status: {
      type: String,
      enum: ["upcoming", "confirmed", "awaiting", "completed", "cancelled", "rescheduled"],
      default: "upcoming",
    },

    vendorAction: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorBooking", bookingSchema);
