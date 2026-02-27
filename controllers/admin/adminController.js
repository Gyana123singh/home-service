const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

const ReferralSettings = require("../../models/ReferralSettings");
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
