const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorService",
      required: true,
    },

    selections: [
      {
        label: String, // e.g. "Area size"
        value: String, // e.g. "2 Rooms"
        extraPrice: Number,
      },
    ],

    date: { type: Date, required: true },
    time: {
      type: String, // ✅ ADDED
    },

    basePrice: Number,
    addonsPrice: Number,
    unitPrice: Number, // ✅ add this
    totalPrice: Number,

    quantity: { type: Number, default: 1 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cart", cartSchema);
