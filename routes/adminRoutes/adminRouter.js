const router = require("express").Router();
const adminController = require("../../controllers/admin/adminController");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.post("/", adminController.adminLogin);
router.get(
  "/vendors/pending",
  protect,
  isAdmin,
  adminController.getPendingVendors,
);
router.post(
  "/vendors/:id/approve",
  protect,
  isAdmin,
  adminController.approveVendor,
);

module.exports = router;
