const express = require("express");
const router = express.Router();

const cartRoutes = require("./cartRoutes");
const customerRoutes = require("./customerRouter");
const sliderRoutes = require("./sliderRoutes");
const serviceRoutes = require("./serviceRoutes");
const couponRoutes = require("./couponRoutes");
const bookingRoutes = require("./bookingRoutes");
const reviewRoutes = require("./reviewRoutes");
const notificationRoutes = require("./notificationRoutes");

// Mount review routes
router.use("/reviews", reviewRoutes);

// Mount service routes
router.use("/services", serviceRoutes);

// Mount customer routes
router.use("/", customerRoutes);

// Mount cart routes
router.use("/cart", cartRoutes);
router.use("/sliders", sliderRoutes);
router.use("/coupons", couponRoutes);
// Mount booking routes
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);
// Mount notification routes
router.use("/notifications", notificationRoutes);

module.exports = router;
