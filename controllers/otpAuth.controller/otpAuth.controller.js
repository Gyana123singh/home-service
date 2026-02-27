const admin = require("../../config/firebase");
const User = require("../../models/User");
const generateToken = require("../../utils/generateToken");
const { generateReferralCode } = require("../../utils/referral");

exports.loginWithOtp = async (req, res) => {
  try {
    const { firebaseToken, referralCode } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase token is required",
      });
    }

    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const phone = decoded.phone_number;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number not found in token",
      });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      let referredByUser = null;

      if (referralCode) {
        referredByUser = await User.findOne({ referralCode });

        if (!referredByUser) {
          return res.status(400).json({
            success: false,
            message: "Invalid referral code",
          });
        }

        // ✅ Prevent self-referral
        if (referredByUser.phone === phone) {
          referredByUser = null;
        }
      }

      user = await User.create({
        phone,
        authProvider: "otp",
        role: "customer",
        referralCode: await generateReferralCode("OTP"),
        referredBy: referredByUser ? referredByUser._id : null,
      });
    }

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
    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP token",
    });
  }
};
