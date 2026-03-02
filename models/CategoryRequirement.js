const mongoose = require("mongoose");

const categoryRequirementSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
    },
    requirements: [
      {
        label: { type: String },
        options: [
          {
            label: { type: String },
            extraPrice: { type: Number, default: 0 },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "CategoryRequirement",
  categoryRequirementSchema,
);
