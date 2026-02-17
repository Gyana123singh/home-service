// models/ProviderProfile.js
const mongoose = require("mongoose");

const providerProfileSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    companyName: String,
    slug: { type: String, unique: true },
    description: String,

    visitingCharge: Number,
    advanceBookingDays: Number,
    totalMembers: Number,

    isStoreActive: Boolean,
    isDoorstepActive: Boolean,
    allowLiveChat: Boolean,

    workingDays: [
      {
        day: String,
        from: String,
        to: String,
        isOff: Boolean,
      },
    ],

    // ✅ SINGLE, CORRECT location object
    location: {
      currentLocation: {
        type: String, // Google formatted address
      },
      city: {
        type: String,
        required: true,
      },
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },

    images: {
      profile: String,
      banner: String,
      gallery: [String],
    },

    bankDetails: {
      taxName: String,
      taxNumber: String,
      accountName: String,
      accountNumber: String,
      bankName: String,
      bankCode: String,
      swiftCode: String,
    },

    seo: {
      metaTitle: String,
      metaKeywords: String,
      metaDescription: String,
      schemaMarkup: String,
      metaImage: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProviderProfile", providerProfileSchema);
