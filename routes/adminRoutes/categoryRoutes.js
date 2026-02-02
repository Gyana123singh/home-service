// routes/admin/category.routes.js
const router = require("express").Router();
const categoryController = require("../../controllers/admin/categoryController");
const categoryUpload = require("../../middleware/categoryMulter");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.post(
  "/add-category",
  protect,
  isAdmin,
  categoryUpload,
  categoryController.createCategory,
);

router.get("/get-category", protect, isAdmin, categoryController.getCategories);

module.exports = router;
