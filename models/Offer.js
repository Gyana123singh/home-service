const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    applicableType: {
      type: String,
      enum: ["global", "category", "service"],
      default: "global",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: Boolean,
      default: true, // active
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);