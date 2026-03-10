const admin = require("../../config/firebase");
const User = require("../../models/User");
const generateToken = require("../../utils/generateToken");
const { generateReferralCode } = require("../../utils/referral");

exports.loginWithOtp = async (req, res) => {
  try {
    console.log("REQUEST BODY:", req.body);

    const { firebaseToken, referralCode } = req.body;

    if (!firebaseToken) {
      console.log("TOKEN MISSING");
      return res.status(400).json({
        success: false,
        message: "Firebase token is required",
      });
    }

    console.log("TOKEN LENGTH:", firebaseToken.length);

    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    console.log("DECODED TOKEN:", decoded);

    const phone = decoded.phone_number;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number not found in token",
      });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        authProvider: "otp",
        role: "customer",
        referralCode: await generateReferralCode("OTP"),
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: "OTP login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("FIREBASE VERIFY ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP token",
    });
  }
};
