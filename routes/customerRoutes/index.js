const express = require("express");
const router = express.Router();

const cartRoutes = require("./cartRoutes");
const customerRoutes = require("./customerRouter");
const sliderRoutes = require("./sliderRoutes");
const serviceRoutes = require("./serviceRoutes");
const bookingRoutes = require("./bookingRoutes");

// Mount booking routes
router.use("/bookings", bookingRoutes);

// Mount service routes
router.use("/services", serviceRoutes);

// Mount customer routes
router.use("/", customerRoutes);

// Mount cart routes
router.use("/cart", cartRoutes);
router.use("/sliders", sliderRoutes);


module.exports = router;
