const express = require("express");
const router = express.Router();

// Import all admin routes
const vendorRoutes = require("./vendorRouter");
const vendorKycRoutes = require("./vendorKycRoutes");
// const vendorServiceRoutes = require("./vendorServiceRoutes");
// const vendorBookingRoutes = require("./vendorBookingRoutes");

// Mount routes
router.use("/", vendorRoutes);
router.use("/categories", vendorKycRoutes);
// router.use("/service", vendorServiceRoutes);
// router.use("/booking", vendorBookingRoutes);

module.exports = router;
