// models/ServiceOption.js
const mongoose = require("mongoose");

const serviceOptionSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory", // e.g. Cleaning
      required: true,
    },

    type: {
      type: String,
      enum: ["bedrooms", "cleaning_type", "frequency"],
      required: true,
    },

    label: {
      type: String, // e.g. "1BHK", "Deep Clean", "Weekly"
      required: true,
    },

    extraPrice: {
      type: Number, // e.g. 899, 1200, 0
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceOption", serviceOptionSchema);
