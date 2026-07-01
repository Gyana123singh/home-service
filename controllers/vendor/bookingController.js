const Booking = require("../../models/Booking");
const User = require("../../models/User");
const { creditVendor } = require("../../utils/walletService");
const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const Wallet = require("../../models/Wallet");
const { razorpay } = require("../../utils/razorpay");
const { sendNotification } = require("../../utils/notification");

// =========================
// GET VENDOR BOOKINGS
// =========================
exports.getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const bookings = await Booking.find({ vendor: vendorId })
      .populate("customer", "firstName lastName phone")
      .populate("service", "title")
      .populate("order") // important for address
      .sort({ createdAt: -1 });

    res.json({
      success: true,
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

    // Notify customer
    await sendNotification(
      booking.customer,
      "Booking Confirmed",
      `Your booking request for a service has been confirmed by the provider.`,
      "booking",
      { bookingId: booking._id.toString() }
    );

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
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    // Notify customer
    await sendNotification(
      booking.customer,
      "Booking Declined",
      `Your booking request was declined. A refund has been processed if applicable.`,
      "booking",
      { bookingId: booking._id.toString() }
    );

    // ================= REFUND =================

    if (booking.paymentMethod === "RAZORPAY") {
      const payment = await Payment.findOne({
        order: booking.order,
      });

      if (payment && payment.status === "held" && payment.razorpayPaymentId) {
        try {
          await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(payment.amount * 100),
          });
          payment.status = "refunded";
          await payment.save();
          console.log("Razorpay refund successful");
        } catch (refundError) {
          console.error("Refund failed:", refundError);
        }
      }
    }

    // ================= SOCKET EVENTS =================

    if (io) {
      io.to(`vendor:${booking.vendor}`).emit("booking:update", booking);
      io.to(`user:${booking.customer}`).emit("booking:update", booking);
      io.to("admin").emit("booking:update", booking);

      io.to(`vendor:${booking.vendor}`).emit("vendor:dashboard:update", {
        type: "booking_cancelled",
      });
    }

    return res.json({
      success: true,
      message: "Booking declined and refund processed (if applicable)",
      data: booking,
    });
  } catch (error) {
    console.error("DECLINE BOOKING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
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

// ======================= COMPLETE BOOKING =======================
exports.completeBooking = async (req, res) => {
  try {
    const io = req.app.get("io");
    const bookingId = req.params.id;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 🔥 ADD THIS CHECK HERE
    if (booking.walletCredited) {
      return res.json({
        success: true,
        message: "Wallet already credited",
        data: booking,
      });
    }

    if (booking.status === "completed") {
      return res.json({
        success: true,
        message: "Booking already completed",
        data: booking,
      });
    }

    booking.status = "completed";
    booking.paymentStatus = "paid";

    await booking.save();

    // Notify customer
    await sendNotification(
      booking.customer,
      "Booking Completed",
      `Your service booking has been marked as completed. Thank you!`,
      "booking",
      { bookingId: booking._id.toString() }
    );

    const order = await Order.findById(booking.order);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Linked order not found",
      });
    }

    // ================= ONLINE PAYMENT =================
    if (booking.paymentMethod !== "COD") {
      const payment = await Payment.findOne({ order: order._id });

      if (payment && payment.status === "held") {
        await creditVendor(order.vendor, order.escrowAmount, booking._id, io);

        payment.status = "released";
        payment.releasedAt = new Date();
        await payment.save();
      }
    }

    // ================= COD =================
    if (booking.paymentMethod === "COD") {
      await creditVendor(order.vendor, order.grandTotal, booking._id, io);
      // Update the payment log to success
      await Payment.findOneAndUpdate(
        { order: order._id },
        { status: "released", releasedAt: new Date() }
      );
    }

    // 🔥 Mark as credited
    booking.walletCredited = true;
    await booking.save();

    // 🔔 SOCKET UPDATES
    io?.to(`vendor:${booking.vendor}`).emit("booking:update", booking);
    io?.to(`user:${booking.customer}`).emit("booking:update", booking);
    io?.to("admin").emit("booking:update", booking);

    io?.to(`vendor:${booking.vendor}`).emit("vendor:dashboard:update", {
      type: "booking_completed",
    });

    return res.json({
      success: true,
      message: "Booking completed & wallet credited",
      data: booking,
    });
  } catch (err) {
    console.error("Complete booking error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
