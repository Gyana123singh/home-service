const router = require("express").Router();
const vendorApprovalController = require("../../controllers/admin/vendorApprovalController");

// Get all vendors (with filter)
router.get("/", vendorApprovalController.getAllVendors);

// Get pending vendors
router.get("/pending", vendorApprovalController.getPendingVendors);

// Approve vendor
router.put("/:vendorId/approve", vendorApprovalController.approveVendor);

// Reject vendor
router.put("/:vendorId/reject", vendorApprovalController.rejectVendor);

module.exports = router;