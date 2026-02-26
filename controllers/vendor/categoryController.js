// controllers/vendor/categoryController.js
const ServiceCategory = require("../../models/ServiceCategory");


// =========================
// GET ALL CATEGORIES (VENDOR)
// =========================
exports.getVendorCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ status: true }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    console.error("GET VENDOR CATEGORIES ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
