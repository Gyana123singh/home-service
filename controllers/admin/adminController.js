const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

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

exports.getPendingVendors = async (req, res) => {
  const vendors = await User.find({ role: "vendor", vendorStatus: "pending" });
  res.json({ success: true, vendors });
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