const express = require("express");
const router = express.Router();

// Import all admin routes
const vendorRoutes = require("./vendorRouter");
const withdrawRoutes = require("./withdrawRoutes");
const vendorBookingRoutes = require("./bookingRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");
const serviceRoutes = require("./serviceRouter");
const categoryRoutes = require("./categoryRoutes");


// Mount routes
router.use("/", vendorRoutes);
router.use("/booking", vendorBookingRoutes);
router.use("/withdraw", withdrawRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/service", serviceRoutes);
router.use("/category", categoryRoutes);

module.exports = router;
