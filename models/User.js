const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
    firstName: String,
    lastName: String,

    // ================= LOCATION (ADD THIS) =================
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: null,
      },
    },

    locationEnabled: {
      type: Boolean,
      default: false,
    },

    lastLocationUpdatedAt: {
      type: Date,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
    },

    // ================= AUTH =================
    password: {
      type: String,
      select: false,
    },

    googleId: String,

    authProvider: {
      type: String,
      enum: ["local", "google", "otp"],
      default: "local",
    },

    otp: {
      code: String,
      expiresAt: Date,
    },

    // ================= ROLE =================
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },

    // ================= VENDOR FIELDS =================
    designation: String,

    zones: [
      {
        type: String,
      },
    ],

    commissionType: {
      type: String,
      enum: ["freelance", "percentage"],
    },

    commissionValue: Number,

    vendorStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
    },

    // ✅ KYC UNIQUE
    aadhaarNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    panNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    // ✅ Hide documents by default
    documents: {
      aadhaarImage: { type: String, select: false },
      panImage: { type: String, select: false },
      passportPhoto: { type: String, select: false },
      companyCertificate: { type: String, select: false }, //trade liacense
    },

    referralCode: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
