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
  getMyCategories,
  submitPersonalInfo,
} = require("../../controllers/vendor/vendorController");

const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

// ✅ Dedicated multer for vendor onboarding uploads
const vendorOnboardingMulter = require("../../middleware/providerMulter");

// =========================
// AUTH
// =========================
router.post("/register", registerVendor);
router.post("/login", vendorLogin);

router.post("/submit-personal-info", protect, isVendor, submitPersonalInfo);

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
// PROFILE & SETTINGS
// =========================
router.get("/profile", protect, isVendor, getVendorProfile);

// Set vendor categories (from admin categories)
router.post("/set-categories", protect, isVendor, setVendorCategories);

// Change active category
router.post("/set-active-category", protect, isVendor, setActiveCategory);

// Get my categories + active category
router.get("/my-categories", protect, isVendor, getMyCategories);

// =========================
// DASHBOARD
// =========================
router.get("/dashboard", protect, isVendor, getVendorDashboard);

module.exports = router;
