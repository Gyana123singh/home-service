const express = require("express");
const router = express.Router();
const {
  addServiceToCart,
  getMyCart,
  removeFromCart,
  updateQuantity,
  checkOut,
} = require("../../controllers/customer/cartController");
const { protect } = require("../../middleware/auth.middleware");
router.post("/add-service-to-cart", protect, addServiceToCart);
router.get("/my-cart", protect, getMyCart);
router.delete("/remove/:id", protect, removeFromCart);

// Update quantity
router.put("/update-quantity/:id", protect, updateQuantity);
router.post("/checkout", protect, checkOut);

module.exports = router;
