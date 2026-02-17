const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: String,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Category", categorySchema);
