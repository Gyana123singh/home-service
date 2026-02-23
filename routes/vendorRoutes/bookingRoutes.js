const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

const bookingController = require("../../controllers/vendor/bookingController");

// =========================
// BOOKINGS
// =========================

// GET /api/vendor/bookings?status=pending|confirmed|completed|cancelled
router.get("/bookings", protect, isVendor, bookingController.getVendorBookings);

// POST /api/vendor/bookings/:id/accept
router.post(
  "/bookings/:id/accept",
  protect,
  isVendor,
  bookingController.acceptBooking,
);

// POST /api/vendor/bookings/:id/decline
router.post(
  "/bookings/:id/decline",
  protect,
  isVendor,
  bookingController.declineBooking,
);

// =========================
// WALLET
// =========================

// GET /api/vendor/wallet
router.get("/wallet", protect, isVendor, bookingController.getMyWallet);

// =========================
// WITHDRAW
// =========================


module.exports = router;


// GET /api/vendor/bookings?status=pending

// POST /api/vendor/bookings/:id/accept

// POST /api/vendor/bookings/:id/decline

// GET /api/vendor/wallet

// POST /api/vendor/withdraw/request

// GET /api/vendor/withdraw/my-requests