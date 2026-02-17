const express = require("express");
const router = express.Router();

const {
  createBooking,
} = require("../../controllers/customer/bookingController");
const { protect } = require("../../middleware/auth.middleware");
const { isCustemer } = require("../../middleware/role.middleware");

module.exports = router;
