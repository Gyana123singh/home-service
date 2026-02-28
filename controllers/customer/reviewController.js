const Review = require("../../models/Review");
const Booking = require("../../models/Booking");
const Service = require("../../models/AdminService");
const User = require("../../models/User");

// ======================= WRITE REVIEW =======================
exports.writeReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Booking and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // ✅ Check booking exists
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ✅ Must be completed
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "You can review only completed bookings",
      });
    }

    // ✅ Must belong to logged user
    if (booking.customer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ Prevent duplicate review
    const existingReview = await Review.findOne({
      booking: bookingId,
      customer: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this service",
      });
    }

    // ================= CREATE REVIEW =================
    const review = await Review.create({
      service: booking.service,
      vendor: booking.vendor,
      customer: userId,
      booking: bookingId,
      rating,
      comment,
    });

    // ================= UPDATE SERVICE RATING =================
    const reviews = await Review.find({ service: booking.service });

    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((acc, item) => acc + item.rating, 0) / totalReviews;

    await Service.findByIdAndUpdate(booking.service, {
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    console.error("WRITE REVIEW ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================= GET SERVICE REVIEWS =======================
exports.getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const reviews = await Review.find({ service: serviceId })
      .populate("customer", "firstName lastName")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
