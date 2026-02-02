const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../../utils/generateToken");
const Slider = require("../../models/adminModel/Slider");

// ================== REGISTER ==================
exports.registerCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      password,
      referralCode,
      agreeTerms,
    } = req.body;

    // validation
    if (!firstName || !lastName || !username || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!agreeTerms) {
      return res.status(400).json({
        success: false,
        message: "You must agree to Terms & Conditions",
      });
    }

    // check existing user
    const exists = await User.findOne({
      $or: [{ email }, { phone }, { username }],
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      phone,
      password: hashedPassword,
      referralCode,
      role: "customer",
    });

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.firstName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================== LOGIN ==================
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
      role: "customer",
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.firstName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================
 * GET ACTIVE SLIDERS (CUSTOMER)
 * =========================
 */
exports.getActiveSliders = async (req, res) => {
  try {
    const sliders = await Slider.find({ status: true })
      .populate("category", "slug")
      .populate("provider", "firstName")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: sliders,
    });
  } catch (error) {
    console.error("GET ACTIVE SLIDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
