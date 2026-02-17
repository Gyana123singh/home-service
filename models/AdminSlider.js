// models/Slider.js
const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["special_offer"],
      default: "special_offer",
      required: true,
    },

    webImage: {
      type: String,
      required: true,
    },

    // ====== Special Offer Content ======
    tag: { type: String }, // e.g. "Painting", "Home Cleaning"
    title: { type: String, default: "Special Offer" },
    offerText: { type: String }, // e.g. "30% OFF", "Flat $50 OFF"
    buttonText: { type: String, default: "Book Now" },

    // ====== Redirect Targets ======
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    redirectUrl: String,

    status: {
      type: Boolean,
      default: true, // Active
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Slider", sliderSchema);
