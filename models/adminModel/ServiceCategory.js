// models/ServiceCategory.js
const mongoose = require("mongoose");

const serviceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["category"],
      default: "category",
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    darkColor: {
      type: String,
      required: true,
    },

    lightColor: {
      type: String,
      required: true,
    },

    status: {
      type: Boolean,
      default: true,
    },

    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
      schemaMarkup: String,
      metaImage: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceCategory", serviceCategorySchema);
