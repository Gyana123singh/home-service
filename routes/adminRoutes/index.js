const express = require("express");
const router = express.Router();
// Import all admin routes
const adminRoutes = require("./adminRouter");
const serviceRoutes = require("./serviceRoutes");
const categoryRoutes = require("./categoryRoutes");
const vendorRoutes = require("./vendorApprovalRoutes");
const sliderRoutes = require("./sliderRoutes");
const providerRoutes = require("./providerRoutes");
const withdrawRoutes = require("./withdrawRoutes");
const couponRoutes = require("./couponRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");
const offerRoutes = require("./offerRoutes");

// Mount routes
router.use("/", adminRoutes);
router.use("/services", serviceRoutes);
router.use("/category", categoryRoutes);
router.use("/vendors", vendorRoutes);
router.use("/sliders", sliderRoutes);
router.use("/providers", providerRoutes);
router.use("/wallet", withdrawRoutes);
router.use("/coupons", couponRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/offers", offerRoutes);

module.exports = router;
