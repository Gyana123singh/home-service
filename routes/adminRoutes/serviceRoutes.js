const router = require("express").Router();
const serviceController = require("../../controllers/admin/serviceController");
const serviceUpload = require("../../middleware/serviceMulter");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.post(
  "/add-service",
  protect,
  isAdmin,
  serviceUpload, // must be a function (multer middleware)
  serviceController.createService,
);

router.get("/get-service", protect, isAdmin, serviceController.getServicesAdmin);

router.post(
  "/create-service-options",
  protect,
  isAdmin,
  serviceController.createOption,
);

router.get(
  "/:categoryId",
  protect,
  isAdmin,
  serviceController.getOptionsByCategory,
);

router.patch("/:id/toggle", protect, isAdmin, serviceController.toggleOption);
router.patch("/:id/status", protect, isAdmin, serviceController.toggleServiceStatus);
router.get("/detail/:id", protect, isAdmin, serviceController.getServiceById);
router.put("/:id", protect, isAdmin, serviceController.updateService);
router.delete("/:id", protect, isAdmin, serviceController.deleteService);

module.exports = router;
