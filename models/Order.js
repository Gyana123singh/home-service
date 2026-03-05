const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    globalDiscount: {
      type: Number,
      default: 0,
    },
    items: [
      {
        service: { type: mongoose.Schema.Types.ObjectId, ref: "VendorService" },
        selections: [
          {
            label: String,
            value: String,
            extraPrice: Number,
          },
        ],
        date: Date,
        time: String, // ✅ ADD THIS
        basePrice: Number,
        addonsPrice: Number,
        totalPrice: Number,
        quantity: Number,
      },
    ],

    address: {
      addressLine1: String,
      city: String,
      state: String,
      pincode: String,
    },

    // ✅ UPDATED: Added "STRIPE" to enum
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

    subTotal: Number,
    tax: Number,
    grandTotal: Number,

    status: {
      type: String,
      enum: ["placed", "confirmed", "completed", "cancelled"],
      default: "placed",
    },

    escrowAmount: { type: Number, default: 0 },

    // 🔁 Optional: change default gateway to stripe
    paymentGateway: { type: String, default: "stripe" },

    transactionId: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
