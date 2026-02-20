// models/Service.js
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
      required: true,
    },
    // category: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "ServiceCategory",
    //   required: true,
    // },

    category: {
      type: String, // e.g. "Painting"
      required: true,
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
        label: { type: String, required: true }, // e.g. "Area size", "Paint type"
        options: [
          {
            label: { type: String, required: true }, // e.g. "1 Room", "Distemper"
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
