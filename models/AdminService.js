const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    // BASIC INFO
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    tags: [String],

    // RELATIONS
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // ✅ vendor who owns this service
    },

    // CATEGORY / SECTION
    section: {
      type: String, // e.g. "Home", "Office"
    },

    category: {
      type: String, // e.g. "Cleaning", "Painting"
      required: true,
    },

    serviceMode: {
      type: String, // e.g. "Home", "On Demand"
    },

    // AVAILABILITY
    days: [
      {
        type: String, // e.g. "Mon", "Tue"
      },
    ],

    startTime: {
      type: String, // store as "10:00 AM"
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Both"],
      default: null,
    },
    endTime: {
      type: String, // store as "06:00 PM"
    },

    address: {
      type: String,
    },

    // TASK DETAILS
    durationMinutes: Number,
    membersRequired: Number,
    maxQuantity: Number,

    // PRICING
    priceType: {
      type: String,
      enum: ["tax_included", "tax_excluded"],
      default: "tax_excluded",
    },
    taxId: { type: mongoose.Schema.Types.ObjectId, ref: "Tax" },
    price: { type: Number, required: true },
    discountedPrice: Number,

    // 🆕 SERVICE REQUIREMENTS (FROM UI)
    requirements: [
      {
        label: { type: String, required: true }, // e.g. "Area size"
        options: [
          {
            label: { type: String, required: true }, // e.g. "1 Room"
            extraPrice: { type: Number, default: 0 }, // e.g. 300, 500
          },
        ],
      },
    ],

    // IMAGES
    images: {
      main: String,
      other: [String],
      files: [String],
    },

    // FLAGS
    isCancelable: { type: Boolean, default: false },
    payLaterAllowed: { type: Boolean, default: false },
    atStore: { type: Boolean, default: false },
    atDoorstep: { type: Boolean, default: false },
    approvedByAdmin: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },

    // FAQ
    faqs: [{ question: String, answer: String }],
    averageRating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },
    // SEO
    seo: {
      metaTitle: String,
      metaKeywords: [String],
      metaDescription: String,
      schemaMarkup: String,
      metaImage: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminService", serviceSchema);
