// models/ServiceSubCategory.js
const mongoose = require("mongoose");

const ServiceSubCategorySchema = new mongoose.Schema(
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

    // 🔗 Link to Main Category
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true,
    },
 

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ServiceSubCategory", ServiceSubCategorySchema);
