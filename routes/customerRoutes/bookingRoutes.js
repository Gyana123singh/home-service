// routes/customerRoutes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { getMyBookings } = require("../../controllers/customer/bookingController");

router.get("/my-bookings", protect, getMyBookings);

module.exports = router;