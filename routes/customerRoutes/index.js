const express = require("express");
const router = express.Router();

const cartRoutes = require("./cartRoutes");
const customerRoutes = require("./customerRouter");
const sliderRoutes = require("./sliderRoutes");
const serviceRoutes = require("./serviceRoutes");
const couponRoutes = require("./couponRoutes");

// Mount service routes
router.use("/services", serviceRoutes);

// Mount customer routes
router.use("/", customerRoutes);

// Mount cart routes
router.use("/cart", cartRoutes);
router.use("/sliders", sliderRoutes);
router.use("/coupons", couponRoutes);

module.exports = router;
