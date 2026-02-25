const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../../utils/generateToken");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");
const Booking = require("../../models/Booking");
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

    // ✅ Enforce correct step: must be on "selfie"
    if (vendor.vendorOnboardingStep !== "selfie") {
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

    // ✅ Finish onboarding
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

exports.getVendorDashboard = async (req, res) => {
  const vendor = await User.findById(req.user._id);

  // 🚫 Block if onboarding not completed
  if (vendor.vendorOnboardingStep !== "completed") {
    return res.status(403).json({
      message: "Complete onboarding first",
      step: vendor.vendorOnboardingStep,
    });
  }

  if (!vendor.activeCategory) {
    return res.status(400).json({ message: "No active category selected" });
  }

  const filter = {
    vendor: vendor._id,
    category: vendor.activeCategory,
  };

  const totalBookings = await Booking.countDocuments(filter);
  const pendingJobs = await Booking.countDocuments({
    ...filter,
    status: "upcoming",
  });

  const completed = await Booking.find({ ...filter, status: "completed" });

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
exports.getMyCategories = async (req, res) => {
  const vendor = await User.findById(req.user._id).select(
    "categories activeCategory",
  );

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
