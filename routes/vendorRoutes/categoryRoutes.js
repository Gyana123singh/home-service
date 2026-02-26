// routes/vendor/categoryRoutes.js
const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

const {
  getVendorCategories,
  getVendorSubCategories,
} = require("../../controllers/vendor/categoryController");

// 🗂 Get all main categories
router.get("/get-categories", protect, isVendor, getVendorCategories);



module.exports = router;
