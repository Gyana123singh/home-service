const Booking = require("../../models/Booking");
const User = require("../../models/User");
const Wallet = require("../../models/Wallet");

// =========================
// GET VENDOR BOOKINGS
// =========================
exports.getVendorBookings = async (req, res) => {
  try {
    const { status } = req.query;

    const vendor = await User.findById(req.user._id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!vendor.activeCategory) {
      return res.status(400).json({ message: "No active category selected" });
    }

    const filter = {
      vendor: vendor._id,
      category: vendor.activeCategory,
    };

    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("customer", "firstName lastName phone")
      .populate("service", "title")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      activeCategory: vendor.activeCategory,
      data: bookings,
    });
  } catch (error) {
    console.error("GET VENDOR BOOKINGS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// ACCEPT BOOKING
// =========================
exports.acceptBooking = async (req, res) => {
  try {
    const io = req.app.get("io");

    const booking = await Booking.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "confirmed";
    await booking.save();

    // Emit socket updates (optional safety checks)
    if (io) {
      io.to(`vendor:${booking.vendor}`).emit("booking:update", booking);
      io.to(`user:${booking.customer}`).emit("booking:update", booking);
      io.to("admin").emit("booking:update", booking);

      io.to(`vendor:${booking.vendor}`).emit("vendor:dashboard:update", {
        type: "booking_confirmed",
      });
    }

    res.json({ success: true, message: "Booking accepted", data: booking });
  } catch (error) {
    console.error("ACCEPT BOOKING ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// DECLINE BOOKING
// =========================
exports.declineBooking = async (req, res) => {
  try {
    const io = req.app.get("io");

    const booking = await Booking.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "cancelled";
    await booking.save();

    if (io) {
      io.to(`vendor:${booking.vendor}`).emit("booking:update", booking);
      io.to(`user:${booking.customer}`).emit("booking:update", booking);
      io.to("admin").emit("booking:update", booking);

      io.to(`vendor:${booking.vendor}`).emit("vendor:dashboard:update", {
        type: "booking_cancelled",
      });
    }

    res.json({ success: true, message: "Booking declined", data: booking });
  } catch (error) {
    console.error("DECLINE BOOKING ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// GET MY WALLET
// =========================
exports.getMyWallet = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const wallet = await Wallet.findOne({ user: vendorId });

    return res.json({
      success: true,
      data: wallet || { balance: 0, totalEarnings: 0 },
    });
  } catch (error) {
    console.error("GET MY WALLET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};