const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  { _id: false },
);

const AdminServiceCategory = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    addCategory: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // ✅ ADD THIS
    subCategory: [subCategorySchema],

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
