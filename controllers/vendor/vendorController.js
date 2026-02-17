const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../../utils/generateToken");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");
const Booking = require("../../models/VendorBooking");
const Wallet = require("../../models/VendorWallet");

exports.registerVendor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      password,
      designation,
      zones,
      commissionType,
      commissionValue,

      addressLine1,
      addressLine2,
      city,
      state,
      pincode,

      aadhaarNumber,
      panNumber,
    } = req.body;

    // ✅ Basic validation
    if (
      !firstName ||
      !phone ||
      !password ||
      !designation ||
      !zones ||
      !aadhaarNumber ||
      !panNumber
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // ✅ Parse zones safely
    const parsedZones = typeof zones === "string" ? zones.split(",") : zones;

    // ✅ Check duplicate user
    const exists = await User.findOne({
      $or: [{ phone }, { email }, { username }],
    });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Check duplicate Aadhaar / PAN
    const kycExists = await User.findOne({
      $or: [{ aadhaarNumber }, { panNumber }],
    });

    if (kycExists) {
      return res.status(400).json({
        message: "Aadhaar or PAN already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ Upload documents to Cloudinary (safe helper)
    const documents = {};

    const uploadIfExists = async (key, folder) => {
      if (!req.files?.[key]) return;
      const result = await uploadToCloudinary(req.files[key][0], folder);
      documents[key] = result.secure_url;
    };

    await uploadIfExists("aadhaarImage", "vendors/aadhaar");
    await uploadIfExists("panImage", "vendors/pan");
    await uploadIfExists("passportPhoto", "vendors/passport");
    await uploadIfExists("companyCertificate", "vendors/company");

    const vendor = await User.create({
      firstName,
      lastName,
      username,
      email,
      phone,
      password: hashed,
      role: "vendor",

      designation,
      zones: parsedZones,
      commissionType,
      commissionValue,

      address: {
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
      },

      aadhaarNumber,
      panNumber,
      documents,

      vendorStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Vendor registered, waiting for admin approval",
      vendorId: vendor._id,
      token: generateToken(vendor),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.vendorLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const vendor = await User.findOne({
      phone,
      role: "vendor",
    }).select("+password");

    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    if (vendor.vendorStatus !== "approved") {
      return res.status(403).json({
        message: "Vendor not approved by admin",
      });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // ✅ Remove password before sending response
    vendor.password = undefined;

    res.json({
      token: generateToken(vendor),
      vendor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  const vendorId = req.user._id;

  const totalBookings = await Booking.countDocuments({ vendor: vendorId });
  const pendingJobs = await Booking.countDocuments({
    vendor: vendorId,
    status: "awaiting",
  });
  const rescheduled = await Booking.countDocuments({
    vendor: vendorId,
    status: "rescheduled",
  });

  const wallet = await Wallet.findOne({ user: vendorId });

  res.json({
    success: true,
    stats: {
      totalEarnings: wallet?.totalEarnings || 0,
      totalBookings,
      pendingJobs,
      rescheduled,
    },
  });
};
