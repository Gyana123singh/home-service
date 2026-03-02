const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    // BASIC INFO
    title: { type: String },
    slug: { type: String },
    shortDescription: { type: String },
    description: { type: String },
    tags: [String],

    // RELATIONS
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // ✅ vendor who owns this service
    },

    // CATEGORY / SECTION
    section: {
      type: String, // e.g. "Home", "Office"
    },

    category: {
      type: String, // e.g. "Cleaning", "Painting"
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
    price: { type: Number },
    discountedPrice: Number,

    // 🆕 SERVICE REQUIREMENTS (FROM UI)
    requirements: [
      {
        label: { type: String }, // e.g. "Area size"
        options: [
          {
            label: { type: String }, // e.g. "1 Room"
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
