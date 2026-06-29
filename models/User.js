const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
    firstName: String,
    lastName: String,
    avatar: String,

    // ================= LOCATION (GEOJSON) =================
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: (coords) => coords == null || coords.length === 2,
          message: "Point must be an array of [longitude, latitude]",
        },
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceCategory",
      },
    ],

    activeCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
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
    // ================= ONLINE STATUS (VENDOR) =================
    isOnline: {
      type: Boolean,
      default: false,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VendorService",
      },
    ],
    subscription: {
      plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
      },
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ["active", "expired", "none"],
        default: "none",
      },
      stripeSessionId: String,
      razorpayPaymentLinkId: String,
    },
    bankDetails: {
      accountNumber: String,
      ifsc: String,
      accountHolderName: String,
      bankName: String,
    },
    upiId: String,
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    referralEarnings: {
      type: Number,
      default: 0,
    },

    referralCount: {
      type: Number,
      default: 0,
    },

    referralRewarded: {
      type: Boolean,
      default: false, // prevents duplicate reward
    },
    savedAddresses: [
      {
        label: { type: String, default: "Home" }, // Home, Office, etc
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        pincode: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Sanitize invalid location data before saving
userSchema.pre("validate", function () {
  if (!this.location) {
    return;
  }

  const { type, coordinates } = this.location;

  if (
    !type ||
    type !== "Point" ||
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    coordinates.some((value) => value === null || value === undefined || Number.isNaN(Number(value)))
  ) {
    this.location = undefined;
    return;
  }

  this.location.type = "Point";
  this.location.coordinates = [Number(coordinates[0]), Number(coordinates[1])];
});

// ================= GEO INDEX =================
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
