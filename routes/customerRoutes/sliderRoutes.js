const express = require("express");
const router = express.Router();

const { getSliders } = require("../../controllers/customer/sliderController");
const { protect } = require("../../middleware/auth.middleware");
const { isCustemer } = require("../../middleware/role.middleware");

router.get("/get-sliders", getSliders);

module.exports = router;
