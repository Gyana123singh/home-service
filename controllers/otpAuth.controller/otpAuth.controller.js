const admin = require("../../config/firebase");
const User = require("../../models/User");
const generateToken = require("../../utils/generateToken");

exports.firebaseOtpLogin = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({
        message: "Firebase token required",
      });
    }

    // verify token
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    const phone = decoded.phone_number;

    if (!phone) {
      return res.status(400).json({
        message: "Phone number not found",
      });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        role: "customer",
        authProvider: "otp",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired OTP",
    });
  }
};
