const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

const bookingController = require("../../controllers/vendor/bookingController");

// =========================
// BOOKINGS
// =========================

// GET /api/vendor/bookings?status=pending|confirmed|completed|cancelled
router.get("/get-vendor-bookings", bookingController.getVendorBookings);

// POST /api/vendor/bookings/:id/accept
router.post(
  "/bookings/:id/accept",

  bookingController.acceptBooking,
);

// POST /api/vendor/bookings/:id/decline
router.post(
  "/bookings/:id/decline",

  bookingController.declineBooking,
);

// =========================
// WALLET
// =========================

// GET /api/vendor/wallet
router.get("/wallet", bookingController.getMyWallet);

// 👉 “Mark as Completed” / “Finish Job”
router.post(
  "/bookings/:id/complete",

  bookingController.completeBooking,
);

module.exports = router;
