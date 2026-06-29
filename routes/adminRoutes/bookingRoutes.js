const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");
const {
  getAllBookings,
  updateBooking,
  deleteBooking,
  getBookingPayments,
} = require("../../controllers/admin/bookingController");

// ================= Bookings =================
router.get("/", protect, isAdmin, getAllBookings);
router.put("/:id", protect, isAdmin, updateBooking);
router.delete("/:id", protect, isAdmin, deleteBooking);

// ================= Booking Payments =================
router.get("/payments/list", protect, isAdmin, getBookingPayments);

module.exports = router;
