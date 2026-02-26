const User = require("../../models/User");
const Service = require("../../models/AdminService");
const bcrypt = require("bcryptjs");
const generateToken = require("../../utils/generateToken");
const Slider = require("../../models/AdminSlider");
const ServiceCategory = require("../../models/ServiceCategory");
const { sendRegistrationMail } = require("../../service/mailService");

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

    // Send registration emails to both user and admin
    try {
      await sendRegistrationMail({
        firstName,
        lastName,
        email,
      });
    } catch (mailError) {
      console.error("Registration email failed:", mailError.message);
    }

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

/**
 * =========================
 * GET CATEGORY LIST USER SIDE
 * =========================
 */

exports.getCategories = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ],
    };

    const categories = await ServiceCategory.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await ServiceCategory.countDocuments(query);

    return res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      data: categories,
    });
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================
 * TURN ON / UPDATE LOCATION
 * =========================
 * body: { latitude, longitude }
 */
exports.turnOnLocation = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        locationEnabled: true,
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)], // [lng, lat]
        },
        lastLocationUpdatedAt: new Date(),
      },
      { new: true },
    );

    return res.json({
      success: true,
      message: "Location turned ON and updated",
      data: {
        locationEnabled: user.locationEnabled,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("TURN ON LOCATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================
 * TURN OFF LOCATION
 * =========================
 */
exports.turnOffLocation = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        locationEnabled: false,
        $unset: { location: "" },
      },
      { new: true },
    );

    return res.json({
      success: true,
      message: "Location turned OFF",
      data: {
        locationEnabled: user.locationEnabled,
      },
    });
  } catch (error) {
    console.error("TURN OFF LOCATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================
 * GET MY LOCATION STATUS
 * =========================
 */
exports.getMyLocationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "locationEnabled location lastLocationUpdatedAt",
    );

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GET LOCATION STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GET MY PROFILE
// =======================
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// UPDATE MY PROFILE
// =======================
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, phone } = req.body;

    // Optional: avatar if you upload image
    const avatar = req.file ? req.file.path : undefined;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/favorites
exports.getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("favorites");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      data: user.favorites || [],
    });
  } catch (error) {
    console.error("GET FAVORITES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/favorites/:serviceId
exports.addToFavorites = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.favorites.includes(serviceId)) {
      user.favorites.push(serviceId);
      await user.save();
    }

    return res.json({
      success: true,
      message: "Added to favorites",
    });
  } catch (error) {
    console.error("ADD TO FAVORITES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/favorites/:serviceId
exports.removeFromFavorites = async (req, res) => {
  try {
    const { serviceId } = req.params;

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favorites: serviceId },
    });

    return res.json({
      success: true,
      message: "Removed from favorites",
    });
  } catch (error) {
    console.error("REMOVE FAVORITE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/addresses
exports.getMyAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      data: user.savedAddresses || [],
    });
  } catch (error) {
    console.error("GET ADDRESSES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/addresses
exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const newAddress = req.body;

    // If first address, make it default
    if (user.savedAddresses.length === 0) {
      newAddress.isDefault = true;
    }

    user.savedAddresses.push(newAddress);
    await user.save();

    return res.json({
      success: true,
      message: "Address added",
      data: user.savedAddresses,
    });
  } catch (error) {
    console.error("ADD ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /api/addresses/:addressId
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const address = user.savedAddresses.id(addressId);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    Object.assign(address, req.body);
    await user.save();

    return res.json({ success: true, message: "Address updated" });
  } catch (error) {
    console.error("UPDATE ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/addresses/:addressId
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.savedAddresses = user.savedAddresses.filter(
      (a) => a._id.toString() !== addressId,
    );

    await user.save();

    return res.json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error("DELETE ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /api/addresses/set-default/:addressId
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.savedAddresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    return res.json({ success: true, message: "Default address set" });
  } catch (error) {
    console.error("SET DEFAULT ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
