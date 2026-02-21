const express = require("express");
const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
  getActiveSliders,
  turnOnLocation,
  turnOffLocation,
  getMyLocationStatus,
  getMyProfile,
  updateMyProfile,
} = require("../../controllers/customer/customerController");
const { protect } = require("../../middleware/auth.middleware");

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.get("/get-sliders", getActiveSliders);

// for updating the locations
router.get("/get-my-location", protect, getMyLocationStatus);
router.post("/location-on", protect, turnOnLocation);
router.post("/location-off", protect, turnOffLocation);
// Get profile (for Profile screen)
router.get("/get-my-profile", protect, getMyProfile);

// Update profile (for Edit Profile screen)
router.put("/updated-my-profile", protect, updateMyProfile);

module.exports = router;
