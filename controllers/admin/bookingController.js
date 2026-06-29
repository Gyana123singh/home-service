const Booking = require("../../models/Booking");
const Payment = require("../../models/Payment");
const Order = require("../../models/Order");

// ==========================================
// BOOKINGS MANAGEMENT
// ==========================================

// GET /api/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "firstName lastName email phone")
      .populate("vendor", "firstName lastName phone")
      .populate("service", "title")
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(b => {
      const customerName = b.customer ? `${b.customer.firstName || ""} ${b.customer.lastName || ""}`.trim() : "Unknown Customer";
      const providerName = b.vendor ? `${b.vendor.firstName || ""} ${b.vendor.lastName || ""}`.trim() : "Unknown Provider";

      return {
        id: b._id,
        userId: b.customer?._id || "-",
        customer: {
          name: customerName,
          email: b.customer?.email || "-",
          phone: b.customer?.phone || "-"
        },
        provider: {
          name: providerName,
          email: b.vendor?.email || "-",
          rating: 4.8 // default rating fallback
        },
        service: b.service?.title || b.category || "Service",
        finalTotal: b.totalPrice,
        status: b.status,
        bookingDate: b.date,
        paymentStatus: b.paymentStatus
      };
    });

    res.json({
      success: true,
      data: formattedBookings
    });
  } catch (error) {
    console.error("GET ALL BOOKINGS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load bookings" });
  }
};

// PUT /api/admin/bookings/:id
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (status) {
      booking.status = status;
      if (status === "completed") {
        booking.paymentStatus = "paid";
        await Payment.findOneAndUpdate(
          { order: booking.order },
          { status: "released", releasedAt: new Date() }
        );
      }
    }
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
      if (paymentStatus === "paid") {
        await Payment.findOneAndUpdate(
          { order: booking.order },
          { status: "released", releasedAt: new Date() }
        );
      }
    }

    await booking.save();

    res.json({
      success: true,
      message: "Booking updated successfully",
      data: booking
    });
  } catch (error) {
    console.error("UPDATE BOOKING ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to update booking" });
  }
};

// DELETE /api/admin/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({
      success: true,
      message: "Booking deleted successfully"
    });
  } catch (error) {
    console.error("DELETE BOOKING ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to delete booking" });
  }
};


// ==========================================
// BOOKING PAYMENTS MANAGEMENT
// ==========================================

// GET /api/admin/bookings/payments
exports.getBookingPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("vendor", "firstName lastName")
      .populate("order", "escrowAmount")
      .sort({ createdAt: -1 });

    const formattedPayments = payments.map(p => {
      const providerName = p.vendor ? `${p.vendor.firstName || ""} ${p.vendor.lastName || ""}`.trim() : "Unknown Provider";
      const totalAmount = p.amount || 0;
      const escrow = p.order?.escrowAmount || totalAmount;
      const commission = Math.max(0, totalAmount - escrow);

      return {
        id: p._id,
        msg: p.status === "released" ? "Settled by admin" : "Received by admin",
        provider: providerName,
        type: p.status === "released" ? "Settled by settlement" : "Received by admin",
        date: new Date(p.createdAt).toLocaleDateString("en-IN"),
        time: new Date(p.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        total: totalAmount,
        amount: escrow,
        commission: commission,
        status: p.status === "released" ? "Debit" : "Credit"
      };
    });

    res.json({
      success: true,
      data: formattedPayments
    });
  } catch (error) {
    console.error("GET BOOKING PAYMENTS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch booking payments logs" });
  }
};
