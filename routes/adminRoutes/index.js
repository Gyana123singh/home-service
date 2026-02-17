const express = require("express");
const router = express.Router();
// Import all admin routes
const adminRoutes = require("./adminRouter");
const serviceRoutes = require("./serviceRoutes");
const categoryRoutes = require("./categoryRoutes");
const vendorRoutes = require("./vendorApprovalRoutes");
const sliderRoutes = require("./sliderRoutes");
const providerRoutes = require("./providerRoutes");

// Mount routes
router.use("/login", adminRoutes);
router.use("/services", serviceRoutes);
router.use("/category", categoryRoutes);
router.use("/vendors", vendorRoutes);
router.use("/sliders", sliderRoutes);
router.use("/providers", providerRoutes);

module.exports = router;
