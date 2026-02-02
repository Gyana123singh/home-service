// models/Slider.js
const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["default", "category", "provider", "url"],
      required: true,
    },

    appImage: {
      type: String,
      required: true,
    },

    webImage: {
      type: String,
      required: true,
    },

    // optional redirect targets
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
