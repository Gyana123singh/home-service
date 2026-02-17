const express = require("express");
const router = express.Router();
const {
  addToCart,
  getMyCart,
  removeFromCart,
  updateQuantity,
} = require("../../controllers/customer/cartController");
const { protect } = require("../../middleware/auth.middleware");
const { isCustemer } = require("../../middleware/role.middleware");
router.post("/add-To-Cart", protect, isCustemer, addToCart);
router.get("/my-cart", protect, isCustemer, getMyCart);
router.delete("remove/:id", protect, isCustemer, removeFromCart);

// Update quantity
router.put("/update-quantity/:id", auth, updateQuantity);

module.exports = router;
