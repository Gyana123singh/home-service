const router = require("express").Router();
const {
  approveRejectVendor,
  getVendorKycLogs,
} = require("../../controllers/admin/vendorApprovalController");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.patch("/vendor/:vendorId/kyc", protect, isAdmin, approveRejectVendor); //API for Admin reject and approve to vendor' documents
router.get("/vendor/:vendorId/kyc-logs", protect, isAdmin, getVendorKycLogs); //ADMIN VIEW KYC AUDIT LOGS of vendors

module.exports = router;
