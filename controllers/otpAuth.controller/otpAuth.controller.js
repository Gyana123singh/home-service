const admin = require("../../config/firebase");
const User = require("../../models/User");
const generateToken = require("../../utils/generateToken");

// 🔐 Verify Firebase OTP token and login/register user
exports.loginWithOtp = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase token is required",
      });
    }

    // ✅ Verify token with Firebase
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    const phone = decoded.phone_number; // e.g. +919876543210

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number not found in token",
      });
    }

    // ✅ Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        authProvider: "otp",
        role: "customer",
      });
    }

    // ✅ Generate your JWT
    const token = generateToken(user);

    return res.json({
      success: true,
      message: "OTP login successful",
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP LOGIN ERROR:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP token",
    });
  }
};