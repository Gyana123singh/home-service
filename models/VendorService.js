// models/Service.js
const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ===== Service Details =====
    name: { type: String, required: true },          // Service Name
    description: { type: String, required: true },   // Description

    serviceMode: {
      type: String,
      enum: ["home", "shop", "both"],
      required: true,
    },

    section: {
      type: String, // e.g. "Home", "Office"
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // ===== Availability =====
    availability: {
      days: {
        type: [String], // ["Mon", "Tue", "Wed"]
        required: true,
      },
      startTime: {
        type: String, // "09:00"
        required: true,
      },
      endTime: {
        type: String, // "18:00"
        required: true,
      },
    },

    // ===== Price & Location =====
    price: {
      type: Number,
      required: true,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    address: {
      type: String,
      required: true,
    },

    // ===== Media =====
    images: [
      {
        type: String, // Cloudinary URL
      },
    ],

    // ===== Status =====
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorService", serviceSchema);
