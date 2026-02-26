const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");
const serviceController = require("../../controllers/vendor/serviceController");


router.post("/create-services", protect, isVendor, serviceController.createService);
router.get("/get-categories", protect, isVendor, serviceController.getCategories);

module.exports = router;
