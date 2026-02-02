const router = require("express").Router();
const serviceController = require("../../controllers/admin/serviceController");
const serviceUpload = require("../../middleware/serviceMulter");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

// routes/admin/provider.routes.js
router.post(
  "/add-service",
  protect,
  isAdmin,
  serviceUpload,
  serviceController.createService,
);

router.get("/get-service", protect, isAdmin, serviceController.getServices);

module.exports = router;
