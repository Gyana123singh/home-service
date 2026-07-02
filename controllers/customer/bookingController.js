// controllers/customer/bookingController.js
const Booking = require("../../models/Booking");

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { tab = "upcoming" } = req.query;

    let filter = { customer: userId };

    if (tab === "upcoming") {
      filter.status = { $in: ["upcoming", "confirmed", "awaiting"] };
    } else if (tab === "history") {
      filter.status = { $in: ["completed", "cancelled"] };
    } else if (tab === "draft") {
      // If you want draft = unpaid / pending orders
      filter.paymentStatus = "pending";
    }

    const bookings = await Booking.find(filter)
      .populate("service", "title")
      .populate("vendor", "firstName lastName selfieImage avatar")
      .sort({ date: 1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error("Get my bookings error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};