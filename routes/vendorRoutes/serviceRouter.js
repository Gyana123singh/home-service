const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");
const serviceController = require("../../controllers/vendor/serviceController");

router.post(
  "/create-services",
  protect,
  isVendor,
  serviceController.createVendorService,
);
router.get(
  "/get-categories",
  protect,
  isVendor,
  serviceController.getCategories,
);
router.get(
  "/get-vendor-services",
  protect,
  isVendor,
  serviceController.getVendorServices,
);
router.put(
  "/update-service/:id",
  protect,
  isVendor,
  serviceController.updateService,
);
router.delete(
  "/delete-service/:id",
  protect,
  isVendor,
  serviceController.deleteService,
);
router.get(
  "/requirements/:category",
  protect,
  serviceController.getRequirementsByCategory,
);

module.exports = router;
