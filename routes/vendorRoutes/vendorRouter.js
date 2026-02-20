const express = require("express");
const router = express.Router();

const {
  registerVendor,
  vendorLogin,
  uploadIdentityDocs,
  uploadSelfie,
  setVendorCategories,
  setActiveCategory,
  getVendorDashboard,
  getVendorProfile,
  getMyBookings,
  getMyWallet,
} = require("../../controllers/vendor/vendorController");

const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

// ✅ Dedicated multer for vendor onboarding
const vendorOnboardingMulter = require("../../middleware/providerMulter");

// =========================
// AUTH
// =========================
router.post("/register", registerVendor); // 🔥 No file upload here
router.post("/login", vendorLogin);

// =========================
// ONBOARDING
// =========================
router.post(
  "/onboarding/identity",
  protect,
  isVendor,
  vendorOnboardingMulter,
  uploadIdentityDocs,
);

router.post(
  "/onboarding/selfie",
  protect,
  isVendor,
  vendorOnboardingMulter,
  uploadSelfie,
);

// =========================
// VENDOR DASHBOARD
// =========================
router.get("/me", protect, isVendor, getVendorProfile);

router.post("/set-categories", protect, isVendor, setVendorCategories);
router.post("/set-active-category", protect, isVendor, setActiveCategory);

router.get("/dashboard", protect, isVendor, getVendorDashboard);
router.get("/bookings", protect, isVendor, getMyBookings);
router.get("/bookings", protect, isVendor, getMyBookings);
router.get("/wallet", protect, isVendor, getMyWallet);

module.exports = router;
