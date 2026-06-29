const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const ReferralSettings = require("../../models/ReferralSettings");
const Booking = require("../../models/Booking");
const Order = require("../../models/Order");
const VendorService = require("../../models/VendorService");
const SubscriptionPayment = require("../../models/SubscriptionPayment");
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find admin
    const admin = await User.findOne({ email, role: "admin" }).select(
      "+password",
    );

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get Only Customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" }) // 🔥 IMPORTANT
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateReferralSettings = async (req, res) => {
  const { rewardAmount, isActive, minOrderAmount } = req.body;

  let settings = await ReferralSettings.findOne();

  if (!settings) {
    settings = await ReferralSettings.create({
      rewardAmount, 
      isActive,
      minOrderAmount,
    });
  } else {
    settings.rewardAmount = rewardAmount ?? settings.rewardAmount;
    settings.isActive = isActive ?? settings.isActive;
    settings.minOrderAmount = minOrderAmount ?? settings.minOrderAmount;
    await settings.save();
  }

  res.json({
    success: true,
    message: "Referral settings updated",
    data: settings,
  });
};

// 📈 Get Admin Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalProviders = await User.countDocuments({ role: "vendor" });
    const totalServices = await VendorService.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // 💰 Revenue calculations
    const orderStats = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalSales: { $sum: "$grandTotal" } } }
    ]);
    const totalSales = orderStats[0]?.totalSales || 0;

    const subscriptionStats = await SubscriptionPayment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, totalSubscriptions: { $sum: "$amount" } } }
    ]);
    const totalSubscriptions = subscriptionStats[0]?.totalSubscriptions || 0;

    const orderCommissions = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalCommissions: {
            $sum: {
              $subtract: [
                { $ifNull: ["$grandTotal", 0] },
                { $ifNull: ["$escrowAmount", 0] }
              ]
            }
          }
        }
      }
    ]);
    const totalCommissions = orderCommissions[0]?.totalCommissions || 0;

    const adminRevenue = Math.round(totalSubscriptions + totalCommissions);
    const providerRevenue = Math.round(Math.max(0, totalSales - totalCommissions));
    const totalRevenue = Math.round(totalSales + totalSubscriptions);

    // 🕒 Recent bookings (last 10)
    const recentBookings = await Booking.find()
      .populate("customer", "firstName lastName")
      .populate("vendor", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(10);

    const mappedBookings = recentBookings.map(b => {
      const customerName = b.customer ? `${b.customer.firstName || ""} ${b.customer.lastName || ""}`.trim() : "Unknown";
      const vendorName = b.vendor ? `${b.vendor.firstName || ""} ${b.vendor.lastName || ""}`.trim() : "Unknown";
      const start = b.date ? new Date(b.date).toLocaleDateString("en-IN") + " " + (b.time || "") : "-";
      return {
        id: b._id,
        customer: customerName,
        provider: vendorName,
        startTime: start,
        endTime: start,
        status: b.status === "upcoming" || b.status === "awaiting" ? "pending" : 
                b.status === "confirmed" ? "in-progress" : b.status
      };
    });

    // 🏆 Top 3 providers based on completed bookings
    const topProvidersAgg = await Booking.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$vendor", completedBookings: { $sum: 1 } } },
      { $sort: { completedBookings: -1 } },
      { $limit: 3 }
    ]);

    const topProviders = [];
    for (const item of topProvidersAgg) {
      const vendor = await User.findById(item._id).select("firstName lastName");
      if (vendor) {
        topProviders.push({
          name: `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim(),
          rating: "5.0",
          count: `${item.completedBookings} Booking Completed`
        });
      }
    }

    // 🔥 Top 4 trending services based on booking counts
    const trendingServicesAgg = await Booking.aggregate([
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 }
    ]);

    const trendingServices = [];
    for (const item of trendingServicesAgg) {
      const service = await VendorService.findById(item._id).select("title");
      if (service) {
        trendingServices.push({
          title: service.title,
          count: item.count.toString()
        });
      }
    }

    return res.json({
      success: true,
      stats: {
        totalCustomers,
        totalProviders,
        totalServices,
        totalBookings,
        adminRevenue,
        providerRevenue,
        totalRevenue
      },
      recentBookings: mappedBookings,
      topProviders,
      trendingServices
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD STATS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
