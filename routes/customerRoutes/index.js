const express = require("express");
const router = express.Router();

const cartRoutes = require("./cartRoutes");
const customerRoutes = require("./customerRouter");

// Mount customer routes
router.use("/", customerRoutes);

// Mount cart routes
router.use("/cart", cartRoutes);
