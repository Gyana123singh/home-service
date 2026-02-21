const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
    firstName: String,
    lastName: String,

    // ================= LOCATION (GEOJSON) =================
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [],
      },
    },

    // Human-readable location text (for UI: "Delhi, India")
    locationText: {
      city: String,
      state: String,
      country: String,
      fullAddress: String,
    },

    locationEnabled: {
      type: Boolean,
      default: false,
    },

    lastLocationUpdatedAt: {
      type: Date,
    },

    // ================= AUTH / PROFILE =================
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
    vendorOnboardingStep: {
      type: String,
      enum: ["info", "identity", "selfie", "completed"],
      default: "info",
    },

    selfieImage: { type: String, select: false },

    designation: String,

    zones: [String],

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

    categories: [
      {
        type: String, // e.g. "Cleaning", "Electrical", "Plumbing"
      },
    ],

    activeCategory: {
      type: String,
      default: null,
    },

    // ================= ADDRESS =================
    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
    },

    // ================= KYC =================
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

    documents: {
      aadhaarImage: { type: String, select: false },
      panImage: { type: String, select: false },
      passportPhoto: { type: String, select: false },
      companyCertificate: { type: String, select: false },
    },

    referralCode: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ================= GEO INDEX =================
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);