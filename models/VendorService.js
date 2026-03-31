const mongoose = require("mongoose");

const vendorServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    section: {
      type: String,
    },

    category: {
      type: String,
      required: true,
      trim: true,      // ✅ remove spaces
      lowercase: true, // ✅ auto lowercase

    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    days: [
      {
        type: String,
      },
    ],

    startTime: {
      type: String,
    },

    endTime: {
      type: String,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Both"],
      default: null,
    },
    price: {
      // ⭐ add this
      type: Number,
    },
    image: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    requirements: [
      {
        label: String,
        options: [
          {
            label: String,
            extraPrice: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],
  },

  { timestamps: true },
);

module.exports = mongoose.model("VendorService", vendorServiceSchema);
