const express = require("express");
const router = express.Router();

// Import all admin routes
const vendorRoutes = require("./vendorRouter");
const withdrawRoutes = require("./withdrawRoutes");
const vendorBookingRoutes = require("./bookingRoutes");

// Mount routes
router.use("/", vendorRoutes);
router.use("/booking", vendorBookingRoutes);
router.use("/withdraw", withdrawRoutes);

module.exports = router;
