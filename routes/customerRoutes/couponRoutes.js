// routes/customer/couponRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { getAvailableCoupons } = require("../../controllers/customer/couponController");

router.get("/", protect, getAvailableCoupons);

module.exports = router;