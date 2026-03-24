const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../../utils/generateToken");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");
const Booking = require("../../models/Booking");
const ServiceCategory = require("../../models/ServiceCategory");
const Wallet = require("../../models/Wallet");
const VendorService = require("../../models/VendorService");

/**
 * =========================
 * SIGN UP (BASIC INFO ONLY)
 * =========================
 */
exports.registerVendor = async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    if (!fullName || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    const exists = await User.findOne({ $or: [{ phone }, { email }] });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const vendor = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashed,
      role: "vendor",
      vendorStatus: "pending",
      vendorOnboardingStep: "info", // next screen: Personal Info
    });

    return res.status(201).json({
      success: true,
      message: "Account created. Please complete your profile.",
      vendorId: vendor._id,
      token: generateToken(vendor),
      nextStep: "info",
    });
  } catch (error) {
    console.error("REGISTER VENDOR ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * LOGIN
 * =========================
 */
exports.vendorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await User.findOne({ email, role: "vendor" }).select(
      "+password",
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Always allow login and return token
    vendor.password = undefined;

    // 🟡 If onboarding not completed, send step info
    if (vendor.vendorOnboardingStep !== "completed") {
      return res.json({
        success: true,
        token: generateToken(vendor),
        vendor,
        status: "onboarding",
        step: vendor.vendorOnboardingStep, // info | identity | selfie
        message: "Please complete onboarding",
      });
    }

    // 🔵 If admin not approved yet
    if (vendor.vendorStatus === "pending") {
      return res.json({
        success: true,
        token: generateToken(vendor),
        vendor,
        status: "pending",
        message: "Your account is under review",
      });
    }

    // 🔴 If rejected
    if (vendor.vendorStatus === "rejected") {
      return res.status(403).json({
        message: "Your account was rejected. Contact support.",
      });
    }

    // 🟢 Approved and completed
    return res.json({
      success: true,
      token: generateToken(vendor),
      vendor,
      status: "approved",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.submitPersonalInfo = async (req, res) => {
  try {
    const vendor = await User.findById(req.user._id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (vendor.vendorOnboardingStep !== "info") {
      return res.status(400).json({ message: "Info already submitted" });
    }

    const { fullName, email, phone, address } = req.body;

    if (!fullName || !phone || !address) {
      return res
        .status(400)
        .json({ message: "Full name, phone and address are required" });
    }

    const parts = fullName.trim().split(" ");
    vendor.firstName = parts[0];
    vendor.lastName = parts.slice(1).join(" ") || "";
    if (email) vendor.email = email;
    vendor.phone = phone;
    vendor.address = address;

    vendor.vendorOnboardingStep = "identity";
    await vendor.save();

    res.json({
      success: true,
      message: "Personal info saved",
      nextStep: "identity",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * =========================
 * UPLOAD IDENTITY DOCS
 * =========================
 */
exports.uploadIdentityDocs = async (req, res) => {
  try {
    const vendor = await User.findById(req.user._id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ✅ Enforce correct step: must be on "identity"
    if (vendor.vendorOnboardingStep !== "identity") {
      return res.status(400).json({ message: "Complete previous step first" });
    }

    if (
      !req.files?.aadhaarImage &&
      !req.files?.panImage &&
      !req.files?.companyCertificate
    ) {
      return res
        .status(400)
        .json({ message: "At least one document is required" });
    }

    const documents = vendor.documents || {};

    const uploadIfExists = async (key, folder) => {
      if (!req.files?.[key]) return;
      const result = await uploadToCloudinary(req.files[key][0], folder);
      documents[key] = result.secure_url;
    };

    await uploadIfExists("aadhaarImage", "vendors/aadhaar");
    await uploadIfExists("panImage", "vendors/pan");
    await uploadIfExists("companyCertificate", "vendors/company");

    vendor.documents = documents;

    // ✅ Move to next step
    vendor.vendorOnboardingStep = "selfie";
    await vendor.save();

    return res.json({
      success: true,
      message: "Identity documents uploaded",
      nextStep: "selfie",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * UPLOAD SELFIE
 * =========================
 */
exports.uploadSelfie = async (req, res) => {
  try {
    const vendor = await User.findById(req.user._id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (vendor.vendorOnboardingStep !== "selfie") {
      return res.status(400).json({
        message: "Upload identity documents first",
      });
    }

    if (!req.files?.selfie) {
      return res.status(400).json({ message: "Selfie is required" });
    }

    const uploaded = await uploadToCloudinary(
      req.files.selfie[0],
      "vendors/selfie",
    );

    vendor.selfieImage = uploaded.secure_url;

    vendor.vendorOnboardingStep = "completed";
    vendor.vendorStatus = "pending";
    await vendor.save();

    // 🔥 CREATE WALLET SAFELY
    let wallet = await Wallet.findOne({ user: vendor._id });

    if (!wallet) {
      await Wallet.create({
        user: vendor._id,
        balance: 0,
        totalEarnings: 0,
        transactions: [],
      });
    }

    return res.json({
      success: true,
      message: "Selfie uploaded. Waiting for admin approval.",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * VENDOR PROFILE
 * =========================
 */
exports.getVendorProfile = async (req, res) => {
  try {
    // ✅ Support both possible payload styles
    const userId = req.user._id || req.user.id;

    console.log("GET VENDOR PROFILE USER ID:", userId);

    const vendor = await User.findById(userId).select("-password");

    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.json({
      success: true,
      data: {
        vendorStatus: vendor.vendorStatus,
        vendorOnboardingStep: vendor.vendorOnboardingStep,
        vendor,
      },
    });
  } catch (error) {
    console.error("GET VENDOR PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// controllers/vendor/vendorController.js

exports.setVendorCategories = async (req, res) => {
  try {
    const { categories } = req.body; // [ObjectId]

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: "Categories are required" });
    }

    // ✅ Validate ObjectIds exist and are active
    const validCategories = await ServiceCategory.find({
      _id: { $in: categories },
      status: true,
    });

    if (validCategories.length !== categories.length) {
      return res.status(400).json({
        message: "One or more selected categories are invalid",
      });
    }

    const vendor = await User.findById(req.user._id);

    vendor.categories = categories;
    vendor.activeCategory = categories[0];

    await vendor.save();

    return res.json({
      success: true,
      message: "Categories saved successfully",
      categories: vendor.categories,
      activeCategory: vendor.activeCategory,
    });
  } catch (error) {
    console.error("SET VENDOR CATEGORIES ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.setActiveCategory = async (req, res) => {
  const { category } = req.body;

  const vendor = await User.findById(req.user._id);

  if (
    !vendor.categories ||
    !vendor.categories.some((cat) => cat.toString() === category)
  ) {
    return res.status(400).json({ message: "Category not allowed" });
  }

  vendor.activeCategory = category;
  await vendor.save();

  res.json({
    success: true,
    message: "Active category updated",
    activeCategory: vendor.activeCategory,
  });
};

exports.getVendorDashboard = async (req, res) => {
  try {
    // 🔥 Disable cache (fix 304 issue)
    res.set("Cache-Control", "no-store");

    // 🔥 FIX: Support both id and _id
    const vendorId = req.user?._id || req.user?.id;

    console.log("REQ.USER:", req.user);       // Debug
    console.log("Vendor ID:", vendorId);      // Debug

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID missing from token",
      });
    }

    const vendor = await User.findById(vendorId);

    // ✅ Vendor validation
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // ✅ Onboarding check
    if (vendor.vendorOnboardingStep !== "completed") {
      return res.status(403).json({
        success: false,
        message: "Complete onboarding first",
      });
    }

    // ================= BOOKINGS FILTER =================
    const filter = {
      vendor: vendorId,
    };

    console.log("Filter:", filter); // Debug

    // ================= BOOKINGS =================
    const totalBookings = await Booking.countDocuments(filter);

    const pendingJobs = await Booking.countDocuments({
      ...filter,
      status: { $in: ["upcoming", "confirmed", "awaiting"] },
    });

    const rescheduledBookings = await Booking.countDocuments({
      ...filter,
      status: "rescheduled",
    });

    // ================= TOTAL EARNINGS =================
    const earningsAgg = await Booking.aggregate([
      {
        $match: {
          ...filter,
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $multiply: ["$totalPrice", { $ifNull: ["$quantity", 1] }],
            },
          },
        },
      },
    ]);

    const totalEarnings = earningsAgg[0]?.total || 0;

    // ================= DAILY =================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyAgg = await Booking.aggregate([
      {
        $match: {
          ...filter,
          status: "completed",
          updatedAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $multiply: ["$totalPrice", { $ifNull: ["$quantity", 1] }],
            },
          },
        },
      },
    ]);

    const dailyEarnings = dailyAgg[0]?.total || 0;

    // ================= WEEKLY =================
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weeklyAgg = await Booking.aggregate([
      {
        $match: {
          ...filter,
          status: "completed",
          updatedAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $multiply: ["$totalPrice", { $ifNull: ["$quantity", 1] }],
            },
          },
        },
      },
    ]);

    const weeklyEarnings = weeklyAgg[0]?.total || 0;

    // ================= RECENT ACTIVITY =================
    const recentBookings = await Booking.find(filter)
      .populate("customer", "firstName lastName")
      .populate("service", "title")
      .sort({ createdAt: -1 })
      .limit(5);

    // ================= WALLET =================
    const wallet = await Wallet.findOne({ user: vendorId });

    return res.json({
      success: true,
      stats: {
        totalBookings,
        pendingJobs,
        rescheduledBookings,
        totalEarnings,
        dailyEarnings,
        weeklyEarnings,
      },
      wallet: wallet || { balance: 0, totalEarnings: 0 },
      recentActivity: recentBookings,
    });
  } catch (error) {
    console.error("VENDOR DASHBOARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
exports.getMyCategories = async (req, res) => {
  const vendor = await User.findById(req.user._id)
    .populate("categories", "name slug")
    .populate("activeCategory", "name slug");

  res.json({
    success: true,
    categories: vendor.categories || [],
    activeCategory: vendor.activeCategory,
  });
};

// =========================
// GET VENDOR BASIC PROFILE (FOR EDIT SCREEN)
// =========================
exports.getVendorBasicProfile = async (req, res) => {
  try {
    const vendor = await User.findById(req.user._id).select(
      "firstName lastName email phone",
    );

    if (!vendor || vendor.role !== "vendor") {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    return res.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error("GET VENDOR PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================
// UPDATE VENDOR BASIC PROFILE (SAVE BUTTON)
// =========================
exports.updateVendorBasicProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    const vendor = await User.findById(req.user._id);

    if (!vendor || vendor.role !== "vendor") {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    if (firstName !== undefined) vendor.firstName = firstName;
    if (lastName !== undefined) vendor.lastName = lastName;
    if (email !== undefined) vendor.email = email;
    if (phone !== undefined) vendor.phone = phone;

    await vendor.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        email: vendor.email,
        phone: vendor.phone,
      },
    });
  } catch (error) {
    console.error("UPDATE VENDOR PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================
// SET ONLINE STATUS (VENDOR)
// =========================
exports.setOnlineStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isOnline must be true or false",
      });
    }

    const user = await User.findOne({
      _id: userId,
      role: "vendor",
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Only vendors can change online status",
      });
    }

    user.isOnline = isOnline;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Vendor is now ${isOnline ? "Online" : "Offline"}`,
      isOnline: user.isOnline,
    });
  } catch (error) {
    console.error("SET ONLINE STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET ONLINE STATUS (VENDOR)
// =========================
exports.getOnlineStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("isOnline role");

    if (!user || user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Only vendors allowed",
      });
    }

    return res.status(200).json({
      success: true,
      isOnline: user.isOnline,
    });
  } catch (error) {
    console.error("GET ONLINE STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// TOGGLE SERVICE STATUS
// =========================
exports.toggleServiceStatus = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id } = req.params;

    const service = await VendorService.findOne({
      _id: id,
      vendor: vendorId, // ✅ FIXED HERE
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    service.isActive = !service.isActive;

    await service.save();

    return res.json({
      success: true,
      message: `Service is now ${service.isActive ? "active" : "inactive"}`,
      isActive: service.isActive,
    });
  } catch (error) {
    console.error("TOGGLE SERVICE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
