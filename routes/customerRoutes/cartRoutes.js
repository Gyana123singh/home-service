const express = require("express");
const router = express.Router();
const {
  addToCart,
  getMyCart,
  removeFromCart,
  updateQuantity,
} = require("../../controllers/customer/cartController");
const { protect } = require("../../middleware/auth.middleware");
router.post("/add-To-Cart", protect, addToCart);
router.get("/my-cart", protect, getMyCart);
router.delete("/remove/:id", protect, removeFromCart);

// Update quantity
router.put("/update-quantity/:id", protect, updateQuantity);

module.exports = router;
