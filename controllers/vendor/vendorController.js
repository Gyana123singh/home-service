const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../../utils/generateToken");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");
const Booking = require("../../models/Booking");
const Wallet = require("../../models/Wallet");
const WithdrawRequest = require("../../models/WithdrawRequest");
const ServiceCategory = require("../../models/ServiceCategory");

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
    const { phone, password } = req.body;

    const vendor = await User.findOne({ phone, role: "vendor" }).select(
      "+password",
    );
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // If onboarding not completed
    if (vendor.vendorOnboardingStep !== "completed") {
      return res.status(403).json({
        message: "Complete onboarding first",
        step: vendor.vendorOnboardingStep, // info | identity | selfie
      });
    }

    // If admin not approved yet
    if (vendor.vendorStatus === "pending") {
      vendor.password = undefined;
      return res.json({
        success: true,
        token: generateToken(vendor),
        vendor,
        status: "pending",
        message: "Your account is under review",
      });
    }

    if (vendor.vendorStatus === "rejected") {
      return res.status(403).json({
        message: "Your account was rejected. Contact support.",
      });
    }

    vendor.password = undefined;
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

    // Enforce step order
    if (vendor.vendorOnboardingStep !== "info") {
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
    vendor.vendorOnboardingStep = "identity";
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

    // Enforce step order
    if (vendor.vendorOnboardingStep !== "identity") {
      return res
        .status(400)
        .json({ message: "Upload identity documents first" });
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
    vendor.vendorStatus = "pending"; // waiting for admin
    await vendor.save();

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
 * ADMIN: GET PENDING VENDORS
 * =========================
 */
exports.getPendingVendors = async (req, res) => {
  const vendors = await User.find({
    role: "vendor",
    vendorStatus: "pending",
    vendorOnboardingStep: "completed",
  }).select("-password");

  return res.json({ success: true, data: vendors });
};

/**
 * =========================
 * ADMIN: APPROVE VENDOR
 * =========================
 */
exports.approveVendor = async (req, res) => {
  const vendor = await User.findById(req.params.id);

  if (!vendor || vendor.role !== "vendor") {
    return res.status(404).json({ message: "Vendor not found" });
  }

  vendor.vendorStatus = "approved";
  await vendor.save();

  return res.json({ success: true, message: "Vendor approved" });
};

/**
 * =========================
 * VENDOR PROFILE
 * =========================
 */
exports.getVendorProfile = async (req, res) => {
  const vendor = await User.findById(req.user._id).select("-password");

  return res.json({
    success: true,
    data: {
      vendorStatus: vendor.vendorStatus,
      vendorOnboardingStep: vendor.vendorOnboardingStep,
      vendor,
    },
  });
};

// controllers/vendor/vendorController.js

exports.setVendorCategories = async (req, res) => {
  try {
    const { categories } = req.body; // ["Cleaning", "Electrical"]

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: "Categories are required" });
    }

    // 🔍 Get valid categories from Admin
    const validCategories = await ServiceCategory.find({ status: true }).select(
      "name",
    );
    const validNames = validCategories.map((c) => c.name);

    // ❌ Check for invalid category
    const invalid = categories.find((c) => !validNames.includes(c));
    if (invalid) {
      return res.status(400).json({
        message: `Invalid category selected: ${invalid}`,
      });
    }

    // ✅ Save to vendor
    const vendor = await User.findById(req.user._id);

    vendor.categories = categories;
    vendor.activeCategory = categories[0]; // default first one
    await vendor.save();

    return res.json({
      success: true,
      message: "Categories saved",
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

  if (!vendor.categories || !vendor.categories.includes(category)) {
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

exports.getMyBookings = async (req, res) => {
  const vendor = await User.findById(req.user._id);

  if (!vendor.activeCategory) {
    return res.status(400).json({ message: "No active category selected" });
  }

  const bookings = await Booking.find({
    vendor: vendor._id,
    category: vendor.activeCategory, // ✅ FILTER BY CATEGORY
  })
    .populate("customer")
    .populate("service")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    activeCategory: vendor.activeCategory,
    data: bookings,
  });
};

exports.getVendorDashboard = async (req, res) => {
  const vendor = await User.findById(req.user._id);

  const filter = {
    vendor: vendor._id,
    category: vendor.activeCategory,
  };

  const totalBookings = await Booking.countDocuments(filter);
  const pendingJobs = await Booking.countDocuments({
    ...filter,
    status: "upcoming",
  });

  const completed = await Booking.find({
    ...filter,
    status: "completed",
  });

  const totalEarnings = completed.reduce(
    (sum, b) => sum + (b.totalPrice || 0),
    0,
  );

  res.json({
    success: true,
    activeCategory: vendor.activeCategory,
    stats: {
      totalBookings,
      pendingJobs,
      totalEarnings,
    },
  });
};

/**
 * =========================
 * VENDOR BOOKINGS & WALLET
 * =========================
 */

exports.getMyWallet = async (req, res) => {
  const vendorId = req.user._id;
  const wallet = await Wallet.findOne({ user: vendorId });
  return res.json({
    success: true,
    data: wallet || { balance: 0, totalEarnings: 0 },
  });
};

exports.requestWithdraw = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { amount, method, upiId, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const wallet = await Wallet.findOne({ user: vendorId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    if (method === "UPI" && !upiId) {
      return res
        .status(400)
        .json({ success: false, message: "UPI ID required" });
    }

    if (method === "BANK" && !bankDetails?.accountNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Bank details required" });
    }

    const request = await WithdrawRequest.create({
      vendor: vendorId,
      amount,
      method,
      upiId,
      bankDetails,
      status: "pending",
    });

    return res.json({
      success: true,
      message: "Withdraw request submitted",
      data: request,
    });
  } catch (err) {
    console.error("REQUEST WITHDRAW ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMyWithdrawRequests = async (req, res) => {
  const vendorId = req.user._id;

  const requests = await WithdrawRequest.find({ vendor: vendorId }).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    data: requests,
  });
};
