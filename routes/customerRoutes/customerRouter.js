const express = require("express");
const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
} = require("../../controllers/customer/customerController");
const { protect } = require("../../middleware/auth.middleware");
const { isCustomer } = require("../../middleware/role.middleware");
const sliderController = require("../../controllers/customer/customerController");

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

router.get("/get-sliders", sliderController.getActiveSliders);

module.exports = router;
