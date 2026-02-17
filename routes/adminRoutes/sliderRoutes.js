// routes/admin/slider.routes.js
const router = require("express").Router();
const sliderController = require("../../controllers/admin/sliderController");
const sliderUpload = require("../../middleware/admin/sliderMulter");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.post(
  "/add-slider",
  protect,
  isAdmin,
  sliderUpload,
  sliderController.createSlider,
);

router.get("/get-sliders", protect, isAdmin, sliderController.getSliders);

router.get(
  "/special-offers",
  protect,
  isAdmin,
  sliderController.getSpecialOffers,
);
// ✅ new toggle status route
router.patch(
  "/toggle-status/:id",
  protect,
  isAdmin,
  sliderController.toggleSliderStatus,
);
module.exports = router;
