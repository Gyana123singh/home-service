// models/ServiceCategory.js
const mongoose = require("mongoose");

const AdminServiceCategory = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    addCategory: {
      type: String,
      lowercase: true,
      trim: true,
    },

    image: {
      type: String,
    },

    darkColor: {
      type: String,
    },

    lightColor: {
      type: String,
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
  { timestamps: true },
);

module.exports = mongoose.model("ServiceCategory", AdminServiceCategory);
