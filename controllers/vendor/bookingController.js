const Booking = require("../../models/Booking");
const User = require("../../models/User");
const Wallet = require("../../models/Wallet");


// api for vendor booking status
exports.getVendorBookings = async (req, res) => {
  const { status } = req.query;

  const vendor = await User.findById(req.user._id);

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
};

// api for vendor accept booking 
exports.acceptBooking = async (req, res) => {
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

  io.to(`vendor:${booking.vendor}`).emit("booking:update", booking);
  io.to(`user:${booking.customer}`).emit("booking:update", booking);
  io.to("admin").emit("booking:update", booking);

  io.to(`vendor:${booking.vendor}`).emit("vendor:dashboard:update", {
    type: "booking_confirmed",
  });

  res.json({ success: true, message: "Booking accepted", data: booking });
};

// api for vendor declined booking
exports.declineBooking = async (req, res) => {
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

  io.to(`vendor:${booking.vendor}`).emit("booking:update", booking);
  io.to(`user:${booking.customer}`).emit("booking:update", booking);
  io.to("admin").emit("booking:update", booking);

  io.to(`vendor:${booking.vendor}`).emit("vendor:dashboard:update", {
    type: "booking_cancelled",
  });

  res.json({ success: true, message: "Booking declined", data: booking });
};


// api for vendor get wallet
exports.getMyWallet = async (req, res) => {
  const vendorId = req.user._id;
  const wallet = await Wallet.findOne({ user: vendorId });
  return res.json({
    success: true,
    data: wallet || { balance: 0, totalEarnings: 0 },
  });
};

