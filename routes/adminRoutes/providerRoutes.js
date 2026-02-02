const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");
const providerController = require("../../controllers/admin/providerController");
const providerUpload = require("../../middleware/providerMulter");

// routes/admin/provider.routes.js
router.post(
  "/add-provider",
  protect,
  isAdmin,
  providerUpload,
  providerController.createProvider,
);
router.get("/get-provider", protect, isAdmin, providerController.getProviders);
// router.patch("/:vendorId/approve-reject", approveRejectVendor);

module.exports = router;
