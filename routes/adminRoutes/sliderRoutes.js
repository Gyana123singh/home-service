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
  sliderController.createSlider
);

router.get(
  "/get-sliders",
  protect,
  isAdmin,
  sliderController.getSliders
);

module.exports = router;
