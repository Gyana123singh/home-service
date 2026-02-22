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
  getMyFavorites,
  addToFavorites,
  removeFromFavorites,
  getMyAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
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

//Favorites Backend
router.get("/get-my-favorites", protect, getMyFavorites);
router.post("/:serviceId", protect, addToFavorites);
router.delete("/:serviceId", protect, removeFromFavorites);


//Saved Addresses
router.get("/get-my-addresses", protect, getMyAddresses);
router.post("/add-address", protect, addAddress);
router.put("/:addressId", protect, updateAddress);
router.delete("/:addressId", protect, deleteAddress);
router.put("/set-default/:addressId", protect, setDefaultAddress);


module.exports = router;
