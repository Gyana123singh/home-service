const router = require("express").Router();
const categoryController = require("../../controllers/admin/categoryController");
const categoryUpload = require("../../middleware/categoryMulter");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

// Create Category
router.post(
  "/add-category",
  protect,
  isAdmin,
  categoryUpload,
  categoryController.createCategory,
);

// Get Category List
router.get("/get-category", protect, isAdmin, categoryController.getCategories);

module.exports = router;
